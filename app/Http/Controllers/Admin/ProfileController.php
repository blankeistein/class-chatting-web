<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\FirebaseStorageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Kreait\Laravel\Firebase\Facades\Firebase;

class ProfileController extends Controller
{
    public function __construct(
        private FirebaseStorageService $storage,
    ) {}

    /**
     * Show the admin profile edit form.
     */
    public function edit(): Response
    {
        return Inertia::render('Admin/Profile/Edit', [
            'user' => Auth::user(),
        ]);
    }

    /**
     * Update the admin profile.
     */
    public function update(Request $request): RedirectResponse
    {
        $user = Auth::user();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'username' => ['nullable', 'string', 'max:255', Rule::unique('users')->ignore($user->id)],
            'phone' => 'nullable|string|max:20',
            'avatar' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $data = [
            'name' => $request->name,
            'email' => $request->email,
            'username' => $request->username,
            'phone' => $request->phone,
        ];

        if ($request->hasFile('avatar')) {
            $avatarUrl = $this->uploadAvatar($request->file('avatar'), $user);

            if ($avatarUrl) {
                $data['avatar'] = $avatarUrl;
            }
        }

        $user->update($data);

        $this->syncFirebaseProfile($user);

        return redirect()->route('admin.profile.edit')->with('status', 'Profil berhasil diperbarui.');
    }

    /**
     * Update the admin password.
     */
    public function updatePassword(Request $request): RedirectResponse
    {
        $request->validate([
            'current_password' => 'required|current_password',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = Auth::user();

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        $this->syncFirebasePassword($user, $request->password);

        return redirect()->route('admin.profile.edit')->with('status', 'Password berhasil diperbarui.');
    }

    /**
     * Upload avatar to Firebase Storage as compressed WebP.
     */
    private function uploadAvatar($file, $user): ?string
    {
        try {
            $filename = 'user-'.$user->id.'-'.time().'.webp';
            $path = 'image-profile-user/'.$filename;

            // Delete old avatar from Firebase Storage if exists
            $oldPath = $this->storage->extractPath($user->avatar);
            $this->storage->delete($oldPath);

            $this->storage->uploadImageAsWebp($file, $path, 80, 512);

            return $this->storage->buildUrl($path);
        } catch (\Throwable $e) {
            Log::error('Failed to upload avatar to Firebase Storage', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Sync profile changes to Firebase Auth.
     */
    private function syncFirebaseProfile($user): void
    {
        if (blank($user->firebase_uid)) {
            return;
        }

        try {
            $properties = [
                'displayName' => $user->name,
                'email' => $user->email,
            ];

            if ($user->avatar && str_starts_with($user->avatar, 'http')) {
                $properties['photoUrl'] = $user->avatar;
            }

            if ($user->phone) {
                $properties['phoneNumber'] = $user->phone;
            }

            Firebase::auth()->updateUser($user->firebase_uid, $properties);
        } catch (\Throwable $e) {
            Log::warning('Failed to sync profile to Firebase Auth', [
                'user_id' => $user->id,
                'firebase_uid' => $user->firebase_uid,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Sync password change to Firebase Auth.
     */
    private function syncFirebasePassword($user, string $newPassword): void
    {
        if (blank($user->firebase_uid)) {
            return;
        }

        try {
            Firebase::auth()->changeUserPassword($user->firebase_uid, $newPassword);
        } catch (\Throwable $e) {
            Log::warning('Failed to sync password to Firebase', [
                'user_id' => $user->id,
                'firebase_uid' => $user->firebase_uid,
                'error' => $e->getMessage(),
            ]);
        }
    }
}

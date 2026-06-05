<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\User;
use App\Models\UserBook;
use App\Services\FirebaseStorageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Kreait\Firebase\Exception\Auth\EmailExists;
use Kreait\Laravel\Firebase\Facades\Firebase;

class UserController extends Controller
{
    public function __construct(
        private FirebaseStorageService $firebaseStorage
    ) {}

    /**
     * Display a listing of the users.
     */
    public function index(Request $request): Response
    {
        $query = User::query();

        // Search by name, email, username, or firebase_uid
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhere('firebase_uid', 'like', "%{$search}%");
            });
        }

        // Filter by role
        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        // Sort
        $sort = $request->input('sort', 'latest');
        switch ($sort) {
            case 'oldest':
                $query->oldest();
                break;
            case 'name_asc':
                $query->orderBy('name', 'asc');
                break;
            case 'name_desc':
                $query->orderBy('name', 'desc');
                break;
            case 'latest':
            default:
                $query->latest();
                break;
        }

        $perPage = (int) $request->input('perPage', 25);

        $users = $query->with(['books:id,title,cover_url', 'metadata:id,user_id,key,value'])
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Admin/User/Index', [
            'users' => $users,
            'filters' => $request->only(['search', 'sort', 'role']),
        ]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function create(): Response|RedirectResponse
    {
        if (! Gate::allows('create', User::class)) {
            return back()->withErrors([
                'authorization' => 'Kamu tidak punya hak untuk menggunakan fitur ini.',
            ]);
        }

        return Inertia::render('Admin/User/Create');
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(StoreUserRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        // Check if user can assign this role
        $tempUser = new User;
        if (! Gate::allows('changeRole', [$tempUser, $validated['role']])) {
            return back()->withErrors([
                'authorization' => 'Kamu tidak punya hak untuk mengubah role ini.',
            ]);
        }

        // Check if user already exists in database
        $existingUser = User::where('email', $validated['email'])->first();

        if ($existingUser) {
            return back()->withErrors([
                'email' => 'User dengan email ini sudah terdaftar.',
            ]);
        }

        $firebaseUid = null;
        $avatarUrl = null;

        try {
            // Create user in Firebase Auth
            $userProperties = [
                'email' => $validated['email'],
                'password' => $validated['password'],
                'displayName' => $validated['name'],
                'emailVerified' => false,
            ];

            if ($request->hasFile('photo')) {
                $photo = $request->file('photo');
                $photoPath = 'users/avatars/'.uniqid().'.webp';

                // Upload photo to Firebase Storage
                $this->firebaseStorage->uploadImageAsWebp($photo, $photoPath, 80, 500);
                $avatarUrl = $this->firebaseStorage->buildUrl($photoPath);

                $userProperties['photoURL'] = $avatarUrl;
            }

            $firebaseUser = Firebase::auth()->createUser($userProperties);
            $firebaseUid = $firebaseUser->uid;

            // Create user in database
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'username' => $validated['username'],
                'phone' => $validated['phone'],
                'password' => Hash::make($validated['password']),
                'role' => $validated['role'],
                'is_active' => $validated['is_active'] ?? true,
                'firebase_uid' => $firebaseUid,
                'avatar' => $avatarUrl,
            ]);

            return redirect()->route('admin.users.index')->with('success', 'User berhasil ditambahkan.');

        } catch (EmailExists $e) {
            // If user exists in Firebase but not in database, get the Firebase UID
            try {
                $firebaseUser = Firebase::auth()->getUserByEmail($validated['email']);
                $firebaseUid = $firebaseUser->uid;

                // Handle photo upload if provided
                if ($request->hasFile('photo')) {
                    $photo = $request->file('photo');
                    $photoPath = 'users/avatars/'.uniqid().'.webp';

                    $this->firebaseStorage->uploadImageAsWebp($photo, $photoPath, 80, 500);
                    $avatarUrl = $this->firebaseStorage->buildUrl($photoPath);

                    // Update Firebase user photo
                    Firebase::auth()->updateUser($firebaseUid, [
                        'photoURL' => $avatarUrl,
                    ]);
                }

                // Create user in database with existing Firebase UID
                $user = User::create([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'username' => $validated['username'],
                    'phone' => $validated['phone'],
                    'password' => Hash::make($validated['password']),
                    'role' => $validated['role'],
                    'is_active' => $validated['is_active'] ?? true,
                    'firebase_uid' => $firebaseUid,
                    'avatar' => $avatarUrl,
                ]);

                return redirect()->route('admin.users.index')->with('success', 'User berhasil ditambahkan.');

            } catch (\Exception $e) {
                Log::error('Failed to create user: '.$e->getMessage());

                return back()->withErrors([
                    'email' => 'Gagal membuat user. Email mungkin sudah terdaftar di Firebase.',
                ])->withInput();
            }
        } catch (\Exception $e) {
            Log::error('Failed to create user in Firebase: '.$e->getMessage());

            // Cleanup: delete uploaded photo if exists
            if ($avatarUrl) {
                $photoPath = $this->firebaseStorage->extractPath($avatarUrl);
                if ($photoPath) {
                    $this->firebaseStorage->delete($photoPath);
                }
            }

            return back()->withErrors([
                'error' => 'Gagal membuat user di Firebase: '.$e->getMessage(),
            ])->withInput();
        }
    }

    /**
     * Show the form for editing the specified user.
     */
    public function show(User $user): Response
    {
        return Inertia::render('Admin/User/Show', [
            'user' => $user,
        ]);
    }

    public function edit(User $user): Response
    {
        return Inertia::render('Admin/User/Edit', [
            'user' => $user,
        ]);
    }

    /**
     * Update the specified user in storage.
     */
    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $validated = $request->validated();

        // Check if user can change to this role
        if ($validated['role'] !== $user->role) {
            if (! Gate::allows('changeRole', [$user, $validated['role']])) {
                return back()->withErrors([
                    'authorization' => 'Kamu tidak punya hak untuk mengubah role ini.',
                ]);
            }
        }

        $data = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'username' => $validated['username'],
            'phone' => $validated['phone'],
            'role' => $validated['role'],
            'is_active' => $validated['is_active'] ?? true,
        ];

        // Update Firebase Auth user if firebase_uid exists
        if ($user->firebase_uid) {
            $firebaseUpdates = [
                'displayName' => $validated['name'],
            ];

            // Update password in Firebase Auth if changed
            if (! empty($validated['password'])) {
                $data['password'] = Hash::make($validated['password']);
                $firebaseUpdates['password'] = $validated['password'];
            }

            // Update disabled status in Firebase Auth based on is_active
            $firebaseUpdates['disabled'] = ! ($validated['is_active'] ?? true);

            try {
                Firebase::auth()->updateUser($user->firebase_uid, $firebaseUpdates);
            } catch (\Exception $e) {
                Log::warning('Failed to update user in Firebase Auth: '.$e->getMessage());
            }
        } elseif (! empty($validated['password'])) {
            $data['password'] = Hash::make($validated['password']);
        }

        // Handle photo removal
        if ($request->boolean('remove_photo') && $user->avatar) {
            $oldPhotoPath = $this->firebaseStorage->extractPath($user->avatar);
            if ($oldPhotoPath) {
                $this->firebaseStorage->delete($oldPhotoPath);
            }
            $data['avatar'] = null;

            // Update Firebase Auth user photo
            if ($user->firebase_uid) {
                try {
                    Firebase::auth()->updateUser($user->firebase_uid, [
                        'photoURL' => null,
                    ]);
                } catch (\Exception $e) {
                    Log::warning('Failed to remove photo from Firebase Auth: '.$e->getMessage());
                }
            }
        }

        // Handle new photo upload
        if ($request->hasFile('photo')) {
            try {
                // Delete old photo if exists
                if ($user->avatar) {
                    $oldPhotoPath = $this->firebaseStorage->extractPath($user->avatar);
                    if ($oldPhotoPath) {
                        $this->firebaseStorage->delete($oldPhotoPath);
                    }
                }

                // Upload new photo
                $photo = $request->file('photo');
                $photoPath = 'users/avatars/'.uniqid().'.webp';

                $this->firebaseStorage->uploadImageAsWebp($photo, $photoPath, 80, 500);
                $avatarUrl = $this->firebaseStorage->buildUrl($photoPath);

                $data['avatar'] = $avatarUrl;

                // Update Firebase Auth user photo
                if ($user->firebase_uid) {
                    try {
                        Firebase::auth()->updateUser($user->firebase_uid, [
                            'photoURL' => $avatarUrl,
                        ]);
                    } catch (\Exception $e) {
                        Log::warning('Failed to update photo in Firebase Auth: '.$e->getMessage());
                    }
                }
            } catch (\Exception $e) {
                Log::error('Failed to upload user photo: '.$e->getMessage());

                return back()->withErrors([
                    'photo' => 'Gagal mengupload foto: '.$e->getMessage(),
                ])->withInput();
            }
        }

        $user->update($data);

        return redirect()->route('admin.users.index')->with('success', 'User berhasil diperbarui.');
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(User $user): RedirectResponse
    {
        if (! Gate::allows('delete', $user)) {
            return back()->withErrors([
                'authorization' => 'Kamu tidak punya hak untuk menggunakan fitur ini.',
            ]);
        }

        $user->delete();

        return redirect()->back()->with('success', 'User berhasil dihapus.');
    }

    public function bulkDelete(Request $request): RedirectResponse
    {
        return redirect()->back()->withErrors('Fitur bulk delete sedang dalam pengembangan.');
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:users,id'],
        ]);

        $ids = collect($validated['ids'])
            ->filter(fn (int $id): bool => $id !== Auth::id())
            ->values();

        if ($ids->isEmpty()) {
            return redirect()->back()->withErrors('Tidak ada user valid yang dapat dihapus.');
        }

        User::query()->whereIn('id', $ids)->delete();

        return redirect()->back()->with('success', $ids->count().' user berhasil dihapus.');
    }

    /**
     * Display the books owned by the specified user.
     */
    public function books(Request $request, User $user): Response
    {
        $query = UserBook::where('user_id', $user->id)
            ->with([
                'book:id,uuid,title,cover_url,type',
                'activationCode:id,code,type,tier,is_active',
            ]);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('book', function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->input('perPage', 25);

        $userBooks = $query->latest()->paginate($perPage)->withQueryString();

        return Inertia::render('Admin/User/Books', [
            'user' => $user,
            'userBooks' => $userBooks,
            'filters' => $request->only(['search']),
        ]);
    }
}

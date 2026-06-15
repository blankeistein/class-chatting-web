<?php

namespace App\Http\Controllers;

use App\Enums\RoleEnum;
use App\Models\User;
use App\Services\FirebaseCustomTokenService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Kreait\Laravel\Firebase\Facades\Firebase;

class FirebaseAuthController extends Controller
{
    public function __construct(
        protected FirebaseCustomTokenService $firebaseCustomTokenService
    ) {}

    /**
     * Handle Google Sign-In via Firebase Authentication
     */
    public function googleSignIn(Request $request)
    {
        $request->validate([
            'id_token' => 'required|string',
        ]);

        try {
            // Verify Firebase ID token
            $verifiedIdToken = Firebase::auth()->verifyIdToken($request->id_token);
            $uid = $verifiedIdToken->claims()->get('sub');
            $email = $verifiedIdToken->claims()->get('email');
            $name = $verifiedIdToken->claims()->get('name');
            $picture = $verifiedIdToken->claims()->get('picture');
            $emailVerified = $verifiedIdToken->claims()->get('email_verified');

            // Check if email is verified
            if (! $emailVerified) {
                return response()->json([
                    'message' => 'Email belum terverifikasi di Google',
                ], 422);
            }

            // Find or create user by email
            $user = User::where('email', $email)->first();

            if ($user) {
                if (! $user->is_active) {
                    return response()->json([
                        'message' => 'Autentikasi gagal. Silakan coba lagi.',
                    ], 401);
                }

                // User exists - update Firebase UID and avatar if needed
                $user->update([
                    'firebase_uid' => $uid,
                    'avatar' => $picture ?? $user->avatar,
                    'email_verified_at' => $user->email_verified_at ?? now(),
                ]);
            } else {
                // Create new user
                $user = User::create([
                    'firebase_uid' => $uid,
                    'name' => $name,
                    'email' => $email,
                    'avatar' => $picture,
                    'email_verified_at' => now(),
                    'password' => Hash::make(Str::random(32)), // Random password for Google users
                    'role' => RoleEnum::User,
                    'is_active' => true,
                ]);
            }

            // Login user
            Auth::login($user, true);
            $request->session()->regenerate();

            // Generate custom Firebase token for app usage
            $firebaseAuth = $this->firebaseCustomTokenService->issueFor($user);

            // Determine redirect based on role
            $redirectRoute = match ($user->role) {
                RoleEnum::Admin, RoleEnum::Staff => route('admin.dashboard'),
                RoleEnum::Teacher => route('teacher.dashboard'),
                RoleEnum::User, RoleEnum::Student => route('user.dashboard'),
                default => route('home'),
            };

            return response()->json([
                'message' => 'Login berhasil',
                'redirect' => $redirectRoute,
                'firebase_auth' => $firebaseAuth,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role->value,
                ],
            ]);

        } catch (Exception $e) {
            Log::error('Firebase Google Sign-In failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Autentikasi gagal. Silakan coba lagi.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 401);
        }
    }
}

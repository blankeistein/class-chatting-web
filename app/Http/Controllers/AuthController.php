<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Models\User;
use App\Services\FirebaseCustomTokenService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AuthController extends Controller
{
    protected function ensureIsNotRateLimited(Request $request): void
    {
        $key = 'login:'.$request->input('email').'|'.$request->ip();

        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            throw ValidationException::withMessages([
                'email' => "Terlalu banyak percobaan. Coba lagi dalam {$seconds} detik.",
            ]);
        }
    }

    public function login()
    {
        return Inertia::render('Auth/Login');
    }

    public function loginAction(LoginRequest $request, FirebaseCustomTokenService $firebaseCustomTokenService)
    {
        $this->ensureIsNotRateLimited($request);

        $validatedData = $request->validated();

        $auth = [
            'email' => $validatedData['email'],
            'password' => $validatedData['password'],
        ];

        try {
            User::query()->where('email', $validatedData['email'])->firstOrFail();

            $key = 'login:'.$request->input('email').'|'.$request->ip();
            if (! Auth::attempt($auth)) {
                RateLimiter::hit($key, 300);

                Log::warning('Failed login attempt', [
                    'ip' => $request->ip(),
                    'email' => $request->input('email'),
                    'ua' => $request->userAgent(),
                    'time' => now(),
                ]);

                return back()->withErrors([
                    'email' => 'Autentikasi gagal',
                ]);
            }

            RateLimiter::clear($key);

            $request->session()->regenerate();

            $firebaseAuth = $firebaseCustomTokenService->issueFor($request->user());

            if ($request->user()?->role === 'admin') {
                return redirect()
                    ->intended(route('admin.dashboard'))
                    ->with('firebase_auth', $firebaseAuth);
            }

            return redirect()
                ->intended(route('home'))
                ->with('firebase_auth', $firebaseAuth);

        } catch (Exception $e) {
            return back()->withErrors([
                'email' => 'Autentikasi gagal',
            ]);
        }
    }

    public function authenticateFirebaseUser(Request $request, FirebaseCustomTokenService $firebaseCustomTokenService)
    {
        try {
            $firebaseAuth = $firebaseCustomTokenService->issueFor(Auth::user());

            return redirect()
                ->back()
                ->with('firebase_auth', $firebaseAuth);
        } catch (Exception $e) {
            return back()->withErrors('Firebase authentication failed');
        }
    }

    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}

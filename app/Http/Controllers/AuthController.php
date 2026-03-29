<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Models\User;
use App\Services\FirebaseCustomTokenService;
use Exception;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        return Inertia::render('Auth/Login');
    }

    public function loginAction(LoginRequest $request, FirebaseCustomTokenService $firebaseCustomTokenService)
    {
        $validatedData = $request->validated();

        try {
            User::query()->where('email', $validatedData['email'])->firstOrFail();

            if (! Auth::attempt($validatedData)) {
                return back()->withErrors([
                    'email' => 'Email atau password salah',
                ]);
            }

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

        } catch (ModelNotFoundException $e) {
            return back()->withErrors([
                'email' => 'Email tidak ditemukan',
            ]);
        } catch (Exception $e) {
            return back()->withErrors([
                'email' => 'Autentikasi gagal',
            ]);
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

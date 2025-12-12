<?php

namespace App\Http\Controllers;

use App\Models\User;
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

    public function loginAction(Request $request)
    {
        $validatedData = $request->validate([
            'email' => 'required|email|max:255',
            'password' => 'required|max:100',
        ]);

        try {
            $user = User::where('email', $validatedData['email'])->firstOrFail();

            if (Auth::attempt($validatedData)) {
                $request->session()->regenerate();

                if (Auth::user()->role === 'admin') {
                    return redirect()->intended(route('admin.dashboard'));
                }

                return redirect()->intended(route('home'));
            }

            return back()->withErrors([
                'email' => 'Email atau password salah',
            ]);
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
}

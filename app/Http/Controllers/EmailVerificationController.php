<?php

namespace App\Http\Controllers;

use App\Http\Requests\SendVerificationEmailRequest;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerificationController extends Controller
{
    public function notice(): Response|RedirectResponse
    {
        $user = Auth::user();

        if ($user->hasVerifiedEmail()) {
            return to_route('home');
        }

        return Inertia::render('Auth/VerifyEmail');
    }

    public function verify(EmailVerificationRequest $request): RedirectResponse
    {
        $request->fulfill();

        return redirect()->intended(route('home'));
    }

    public function send(SendVerificationEmailRequest $request): RedirectResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->intended(route('home'));
        }

        $key = 'verify-email:'.$request->user()->id;

        if (RateLimiter::tooManyAttempts($key, 1)) {
            $seconds = RateLimiter::availableIn($key);
            $minutes = (int) ceil($seconds / 60);

            return back()->withErrors([
                'email' => "Kamu hanya bisa mengirim ulang verifikasi setiap 5 menit. Coba lagi dalam {$minutes} menit.",
            ]);
        }

        $request->user()->sendEmailVerificationNotification();

        RateLimiter::hit($key, 300);

        return back()->with('status', 'Link verifikasi telah dikirim ke email kamu.');
    }
}

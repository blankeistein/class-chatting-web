<?php

namespace App\Http\Controllers;

use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\ResetPasswordRequest;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Kreait\Firebase\Exception\Auth\UserNotFound;
use Kreait\Laravel\Firebase\Facades\Firebase;

class PasswordResetController extends Controller
{
    public function forgotPassword(): Response
    {
        return Inertia::render('Auth/ForgotPassword');
    }

    public function sendResetLink(ForgotPasswordRequest $request): RedirectResponse
    {
        $status = Password::sendResetLink(
            $request->only('email')
        );

        if ($status === Password::RESET_LINK_SENT) {
            return back()->with('status', __($status));
        }

        return back()->withErrors(['email' => __($status)]);
    }

    public function resetPassword(string $token): Response
    {
        return Inertia::render('Auth/ResetPassword', [
            'token' => $token,
            'email' => request()->query('email', ''),
        ]);
    }

    public function updatePassword(ResetPasswordRequest $request): RedirectResponse
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                $this->syncFirebasePassword($user, $password);

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return redirect()->route('login')->with('status', __($status));
        }

        return back()->withErrors(['email' => __($status)]);
    }

    private function syncFirebasePassword($user, string $password): void
    {
        if (blank($user->firebase_uid)) {
            return;
        }

        try {
            $auth = Firebase::auth();

            try {
                $auth->getUser($user->firebase_uid);
                $auth->changeUserPassword($user->firebase_uid, $password);
            } catch (UserNotFound) {
                Log::warning('Firebase user not found during password reset', [
                    'user_id' => $user->id,
                    'firebase_uid' => $user->firebase_uid,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to sync password to Firebase', [
                'user_id' => $user->id,
                'firebase_uid' => $user->firebase_uid,
                'error' => $e->getMessage(),
            ]);
        }
    }
}

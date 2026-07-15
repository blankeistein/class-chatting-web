<?php

namespace App\Http\Controllers\API\V2;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V2\ResetPasswordRequest;
use App\Http\Requests\API\V2\SendPasswordResetLinkRequest;
use App\Models\User;
use Dedoc\Scramble\Attributes\BodyParameter;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Kreait\Firebase\Exception\Auth\UserNotFound;
use Kreait\Laravel\Firebase\Facades\Firebase;

#[Group('Password Reset V2', 'Endpoint versi 2 untuk lupa password (kirim link) dan reset password (ubah password dengan token dari email).', 24)]
class PasswordResetController extends Controller
{
    #[Endpoint(
        operationId: 'publicPasswordForgotV2',
        title: 'Send password reset link v2',
        description: 'Mengirim link ubah password ke email yang diberikan. Untuk keamanan, response sukses tetap sama meskipun email tidak terdaftar. Throttle bawaan broker password Laravel berlaku (default 60 detik).'
    )]
    #[BodyParameter('email', 'Alamat email akun yang ingin diubah passwordnya.', required: true, example: 'user@example.com')]
    public function sendResetLink(SendPasswordResetLinkRequest $request): JsonResponse
    {
        $email = (string) $request->validated('email');

        $user = User::query()
            ->where('email', $email)
            ->where('is_active', true)
            ->first();

        if ($user) {
            $status = Password::sendResetLink([
                'email' => $email,
            ]);

            if ($status === Password::RESET_THROTTLED) {
                $throttleSeconds = (int) config('auth.passwords.'.config('auth.defaults.passwords').'.throttle', 60);
                $minutes = max(1, (int) ceil($throttleSeconds / 60));

                return $this->errorResponse(
                    429,
                    429,
                    "Terlalu banyak permintaan reset password. Coba lagi dalam {$minutes} menit."
                );
            }

            if ($status !== Password::RESET_LINK_SENT) {
                return $this->errorResponse(
                    500,
                    500,
                    'Gagal mengirim link ubah password. Silakan coba lagi.'
                );
            }
        }

        return $this->successResponse([
            'message' => 'Jika email terdaftar, link ubah password telah dikirim.',
            'data' => [
                'email' => $email,
            ],
        ]);
    }

    #[Endpoint(
        operationId: 'publicPasswordResetV2',
        title: 'Reset password v2',
        description: 'Mengubah password menggunakan token reset yang dikirim melalui email. Token hanya berlaku untuk akun aktif dan akan dihapus setelah berhasil digunakan. Response error disamakan untuk mencegah enumerasi akun.'
    )]
    #[BodyParameter('token', 'Token reset password dari email.', required: true, example: 'a1b2c3d4e5f6...')]
    #[BodyParameter('email', 'Alamat email akun yang direset.', required: true, example: 'user@example.com')]
    #[BodyParameter('password', 'Password baru minimal 8 karakter.', required: true, example: 'passwordBaru123')]
    #[BodyParameter('password_confirmation', 'Konfirmasi password baru.', required: true, example: 'passwordBaru123')]
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $email = (string) $validated['email'];

        $user = User::query()
            ->where('email', $email)
            ->where('is_active', true)
            ->first();

        if (! $user) {
            return $this->errorResponse(
                400,
                400,
                'Token reset tidak valid atau sudah kadaluarsa.'
            );
        }

        $status = Password::reset(
            $validated,
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                $this->syncFirebasePassword($user, $password);

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return $this->successResponse([
                'message' => 'Password berhasil diubah.',
                'data' => [
                    'email' => $email,
                ],
            ]);
        }

        return $this->errorResponse(
            400,
            400,
            'Token reset tidak valid atau sudah kadaluarsa.'
        );
    }

    private function syncFirebasePassword(User $user, string $password): void
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
                Log::warning('Firebase user not found during API password reset', [
                    'user_id' => $user->id,
                    'firebase_uid' => $user->firebase_uid,
                ]);
            }
        } catch (\Throwable $e) {
            Log::error('Failed to sync password to Firebase during API password reset', [
                'user_id' => $user->id,
                'firebase_uid' => $user->firebase_uid,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function successResponse(array $data, int $statusCode = 200): JsonResponse
    {
        return response()->json([
            'status' => true,
            ...$data,
            'version' => 2,
        ], $statusCode);
    }

    private function errorResponse(int $statusCode, int $errorCode, string $message): JsonResponse
    {
        return response()->json([
            'status' => false,
            'errorCode' => $errorCode,
            'message' => $message,
            'version' => 2,
        ], $statusCode);
    }
}

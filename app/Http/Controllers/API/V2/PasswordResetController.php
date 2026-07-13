<?php

namespace App\Http\Controllers\API\V2;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V2\SendPasswordResetLinkRequest;
use App\Models\User;
use Dedoc\Scramble\Attributes\BodyParameter;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Password;

#[Group('Password Reset V2', 'Endpoint versi 2 untuk mengirim link ubah/reset password melalui email.', 24)]
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

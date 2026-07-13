<?php

namespace App\Http\Controllers\API\V2;

use App\Http\Controllers\Controller;
use App\Models\User;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\HeaderParameter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

#[Group('Email Verification V2', 'Endpoint versi 2 untuk mengirim ulang link konfirmasi/verifikasi akun melalui email.', 23)]
class EmailVerificationController extends Controller
{
    private const RATE_LIMIT_DECAY_SECONDS = 300;

    #[Endpoint(
        operationId: 'publicEmailVerificationSendV2',
        title: 'Send account confirmation link v2',
        description: 'Mengirim link konfirmasi akun ke email pengguna yang terautentikasi Firebase. Maksimal 1 pengiriman setiap 5 menit per pengguna.'
    )]
    #[HeaderParameter('Authorization', 'Firebase ID token bearer. Format: `Bearer <firebase_id_token>`.', required: true, example: 'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...')]
    public function send(Request $request): JsonResponse
    {
        $user = $this->resolveActiveUser($request);

        if (! $user) {
            return $this->errorResponse(401, 401, 'Pengguna tidak ditemukan atau tidak aktif.');
        }

        if ($user->hasVerifiedEmail()) {
            return $this->successResponse([
                'message' => 'Email sudah terverifikasi.',
                'data' => [
                    'email' => $user->email,
                    'already_verified' => true,
                    'sent' => false,
                ],
            ]);
        }

        $key = $this->rateLimitKey($user);

        if (RateLimiter::tooManyAttempts($key, 1)) {
            $seconds = RateLimiter::availableIn($key);
            $minutes = (int) ceil($seconds / 60);

            return $this->errorResponse(
                429,
                429,
                "Kamu hanya bisa mengirim ulang verifikasi setiap 5 menit. Coba lagi dalam {$minutes} menit."
            );
        }

        $user->sendEmailVerificationNotification();

        RateLimiter::hit($key, self::RATE_LIMIT_DECAY_SECONDS);

        return $this->successResponse([
            'message' => 'Link verifikasi telah dikirim ke email kamu.',
            'data' => [
                'email' => $user->email,
                'already_verified' => false,
                'sent' => true,
                'retry_after_seconds' => self::RATE_LIMIT_DECAY_SECONDS,
            ],
        ]);
    }

    private function resolveActiveUser(Request $request): ?User
    {
        $firebaseUid = $request->attributes->get('firebase_uid');

        if (! is_string($firebaseUid) || $firebaseUid === '') {
            return null;
        }

        return User::query()
            ->where('firebase_uid', $firebaseUid)
            ->where('is_active', true)
            ->first();
    }

    private function rateLimitKey(User $user): string
    {
        return 'verify-email:'.$user->id;
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

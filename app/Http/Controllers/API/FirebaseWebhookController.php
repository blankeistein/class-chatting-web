<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Dedoc\Scramble\Attributes\BodyParameter;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\HeaderParameter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

#[Group('Firebase Webhooks', 'Webhook internal untuk sinkronisasi data pengguna dari Firebase.', 30)]
class FirebaseWebhookController extends Controller
{
    #[Endpoint(
        operationId: 'firebaseWebhookUserCreated',
        title: 'Sync created Firebase user',
        description: 'Webhook yang menerima event pembuatan user dari Firebase lalu melakukan sinkronisasi atau pembaruan data user lokal.'
    )]
    #[HeaderParameter('X-Firebase-Secret', 'Shared secret untuk memverifikasi bahwa request berasal dari sumber webhook yang sah.', required: true, example: 'firebase-webhook-secret')]
    #[BodyParameter('uuid', 'Firebase UUID pengguna.', required: true, example: 'firebase-user-001')]
    #[BodyParameter('email', 'Alamat email pengguna.', required: true, example: 'user@example.com')]
    #[BodyParameter('displayName', 'Nama tampilan pengguna.', required: false, example: 'Budi')]
    #[BodyParameter('photoURL', 'URL avatar pengguna.', required: false, example: 'https://example.com/avatar.jpg')]
    #[BodyParameter('phoneNumber', 'Nomor telepon pengguna.', required: false, example: '+628123456789')]
    public function userCreated(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'uuid' => 'required|string',
            'email' => 'required|email',
            'displayName' => 'nullable|string',
            'photoURL' => 'nullable|url',
            'phoneNumber' => 'nullable|string',
        ]);

        $user = User::updateOrCreate(
            ['firebase_uid' => $validated['uuid']],
            [
                'name' => $validated['displayName'] ?? 'User',
                'email' => $validated['email'],
                'avatar' => $validated['photoURL'] ?? null,
                'email_verified_at' => now(),
                'phone' => $validated['phoneNumber'] ?? null,
            ]
        );

        Log::info('Firebase user synced', ['uuid' => $validated['uuid'], 'user_id' => $user->id]);

        return response()->json(['message' => 'User synced', 'id' => $user->id], 201);
    }
}

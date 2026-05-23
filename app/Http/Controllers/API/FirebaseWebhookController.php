<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\FirebaseUserCreatedRequest;
use App\Models\User;
use Dedoc\Scramble\Attributes\BodyParameter;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

#[Group('Firebase Webhooks', 'Webhook internal untuk sinkronisasi data pengguna dari Firebase.', 30)]
class FirebaseWebhookController extends Controller
{
    #[Endpoint(
        operationId: 'firebaseWebhookUserCreated',
        title: 'Sync created Firebase user',
        description: 'Webhook yang menerima event pembuatan user dari Firebase lalu melakukan sinkronisasi atau pembaruan data user lokal. Autentikasi menggunakan Firebase ID Token dengan uid `firebase-webhook-service`.'
    )]
    #[BodyParameter('uuid', 'Firebase UUID pengguna.', required: true, example: 'firebase-user-001')]
    #[BodyParameter('email', 'Alamat email pengguna. Wajib kecuali providerType anonymous.', required: false, example: 'user@example.com')]
    #[BodyParameter('displayName', 'Nama tampilan pengguna.', required: false, example: 'Budi')]
    #[BodyParameter('photoURL', 'URL avatar pengguna.', required: false, example: 'https://example.com/avatar.jpg')]
    #[BodyParameter('phoneNumber', 'Nomor telepon pengguna.', required: false, example: '+628123456789')]
    #[BodyParameter('providerType', 'Tipe provider autentikasi Firebase (e.g. password, google.com, anonymous).', required: false, example: 'password')]
    public function userCreated(FirebaseUserCreatedRequest $request): JsonResponse
    {
        $validated = $request->validated();

        if (($validated['providerType'] ?? null) === 'anonymous') {
            Log::info('Skipping anonymous Firebase user', ['uuid' => $validated['uuid']]);

            return response()->json(['message' => 'Anonymous user skipped'], 200);
        }

        $user = User::updateOrCreate(
            ['firebase_uid' => $validated['uuid']],
            [
                'name' => $validated['displayName'] ?? 'User',
                'email' => $validated['email'],
                'avatar' => $validated['photoURL'] ?? null,
                'email_verified_at' => null,
                'phone' => $validated['phoneNumber'] ?? null,
            ]
        );

        Log::info('Firebase user synced', ['uuid' => $validated['uuid'], 'user_id' => $user->id]);

        return response()->json(['message' => 'User synced', 'id' => $user->id], 201);
    }
}

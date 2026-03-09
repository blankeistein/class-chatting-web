<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class FirebaseWebhookController extends Controller
{
    public function userCreated(Request $request)
    {
        $validated = $request->validate([
            'uid' => 'required|string',
            'email' => 'required|email',
            'displayName' => 'nullable|string',
            'photoURL' => 'nullable|url',
            'phoneNumber' => 'nullable|string',
        ]);

        $user = User::updateOrCreate(
            ['firebase_uid' => $validated['uid']],
            [
                'name' => $validated['displayName'] ?? 'User',
                'email' => $validated['email'],
                'avatar' => $validated['photoURL'] ?? null,
                'email_verified_at' => now(),
                'phone' => $validated['phoneNumber'] ?? null,
            ]
        );

        Log::info('Firebase user synced', ['uid' => $validated['uid']]);

        return response()->json(['message' => 'User synced', 'id' => $user->id], 201);
    }
}

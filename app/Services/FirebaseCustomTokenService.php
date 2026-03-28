<?php

namespace App\Services;

use App\Models\User;
use Kreait\Laravel\Firebase\Facades\Firebase;

class FirebaseCustomTokenService
{
    public function issueFor(User $user): array
    {
        $firebaseUid = $this->resolveFirebaseUid($user);
        $customToken = Firebase::auth()->createCustomToken($firebaseUid, [
            'role' => $user->role,
            'user_id' => (string) $user->id,
        ])->toString();

        return [
            'uid' => $firebaseUid,
            'custom_token' => $customToken,
        ];
    }

    private function resolveFirebaseUid(User $user): string
    {
        if (filled($user->firebase_uid)) {
            return $user->firebase_uid;
        }

        $user->forceFill([
            'firebase_uid' => 'web-user-'.$user->id,
        ])->save();

        return $user->firebase_uid;
    }
}

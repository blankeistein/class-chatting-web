<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Kreait\Firebase\Exception\Auth\FailedToVerifyToken;
use Kreait\Laravel\Firebase\Facades\Firebase;
use Symfony\Component\HttpFoundation\Response;

class EnsureFirebaseIdToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $idToken = $request->bearerToken();

        if ($idToken === null || $idToken === '') {
            return response()->json([
                'status' => false,
                'errorCode' => 401,
                'message' => 'Unauthorized. Firebase token is required.',
                'version' => 2,
            ], 401);
        }

        try {
            $verifiedToken = Firebase::auth()->verifyIdToken($idToken);
        } catch (FailedToVerifyToken) {
            return response()->json([
                'status' => false,
                'errorCode' => 401,
                'message' => 'Unauthorized. Firebase token is invalid.',
                'version' => 2,
            ], 401);
        }

        $uid = $verifiedToken->claims()->get('sub');

        if (! is_string($uid) || $uid === '') {
            return response()->json([
                'status' => false,
                'errorCode' => 401,
                'message' => 'Unauthorized. Firebase token does not contain a valid uid.',
                'version' => 2,
            ], 401);
        }

        $request->attributes->set('firebase_uid', $uid);

        return $next($request);
    }
}

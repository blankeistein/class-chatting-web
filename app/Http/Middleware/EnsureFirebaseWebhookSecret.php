<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureFirebaseWebhookSecret
{
    public function handle(Request $request, Closure $next): Response
    {
        $expectedSecret = (string) config('services.firebase.webhook_secret', '');

        if ($expectedSecret === '') {
            return response()->json([
                'status' => false,
                'errorCode' => 500,
                'message' => 'Webhook secret is not configured.',
                'version' => 2,
            ], 500);
        }

        $providedSecret = $request->header('X-Webhook-Secret', '');

        if (! hash_equals($expectedSecret, (string) $providedSecret)) {
            return response()->json([
                'status' => false,
                'errorCode' => 403,
                'message' => 'Forbidden. Invalid webhook secret.',
                'version' => 2,
            ], 403);
        }

        return $next($request);
    }
}

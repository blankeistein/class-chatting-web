<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyFirebaseWebhook
{
    public function handle(Request $request, Closure $next): Response
    {
        $secret = $request->header('X-Firebase-Secret');

        if (empty($secret) || $secret !== config('services.firebase.webhook_secret')) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        return $next($request);
    }
}

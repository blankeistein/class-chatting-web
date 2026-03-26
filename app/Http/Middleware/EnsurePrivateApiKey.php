<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePrivateApiKey
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $expectedApiKey = (string) config('services.private_api.key', '');

        if ($expectedApiKey === '') {
            return new JsonResponse([
                'message' => 'Private API key is not configured.',
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        $providedApiKey = (string) ($request->route('api_key')
            ?? $request->header('X-API-KEY')
            ?? $request->bearerToken()
            ?? $request->string('api_key')->toString());

        if ($providedApiKey === '') {
            return new JsonResponse([
                'message' => 'Private API key is required.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if (! hash_equals($expectedApiKey, $providedApiKey)) {
            return new JsonResponse([
                'message' => 'Private API key is invalid.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        return $next($request);
    }
}

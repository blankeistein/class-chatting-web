<?php

use App\Http\Middleware\EnsureFirebaseWebhookSecret;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

beforeEach(function (): void {
    config()->set('services.firebase.webhook_secret', 'test-webhook-secret');
});

it('rejects request without webhook secret header', function () {
    $middleware = new EnsureFirebaseWebhookSecret;
    $request = Request::create('/test', 'POST');

    $response = $middleware->handle($request, fn () => new Response('OK'));

    expect($response->getStatusCode())->toBe(403);
    expect($response->getContent())->toContain('Invalid webhook secret');
});

it('rejects request with wrong webhook secret', function () {
    $middleware = new EnsureFirebaseWebhookSecret;
    $request = Request::create('/test', 'POST');
    $request->headers->set('X-Webhook-Secret', 'wrong-secret');

    $response = $middleware->handle($request, fn () => new Response('OK'));

    expect($response->getStatusCode())->toBe(403);
    expect($response->getContent())->toContain('Invalid webhook secret');
});

it('allows request with correct webhook secret', function () {
    $middleware = new EnsureFirebaseWebhookSecret;
    $request = Request::create('/test', 'POST');
    $request->headers->set('X-Webhook-Secret', 'test-webhook-secret');

    $response = $middleware->handle($request, fn () => new Response('OK'));

    expect($response->getStatusCode())->toBe(200);
    expect($response->getContent())->toBe('OK');
});

it('returns 500 when webhook secret is not configured', function () {
    config()->set('services.firebase.webhook_secret', '');

    $middleware = new EnsureFirebaseWebhookSecret;
    $request = Request::create('/test', 'POST');
    $request->headers->set('X-Webhook-Secret', 'any-value');

    $response = $middleware->handle($request, fn () => new Response('OK'));

    expect($response->getStatusCode())->toBe(500);
    expect($response->getContent())->toContain('not configured');
});

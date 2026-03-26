<?php

use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\EnsurePrivateApiKey;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\VerifyFirebaseWebhook;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            HandleInertiaRequests::class,
        ]);

        $middleware->alias([
            'admin' => AdminMiddleware::class,
            'firebase.webhook' => VerifyFirebaseWebhook::class,
            'private.api' => EnsurePrivateApiKey::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();

<?php

use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\EnsurePrivateApiKey;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\VerifyFirebaseWebhook;
use App\Mail\ExceptionReported;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function (): void {
            Route::middleware('api')
                ->prefix('private-api')
                ->group(base_path('routes/private-api.php'));
        },
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
        $exceptions->report(function (Throwable $throwable): void {
            if (app()->runningInConsole() && ! app()->runningUnitTests()) {
                return;
            }

            if (! app()->bound('request')) {
                return;
            }

            $developerRecipients = config('mail.developer_recipients', []);

            if ($developerRecipients === []) {
                return;
            }

            if ($throwable instanceof HttpExceptionInterface && $throwable->getStatusCode() < 500) {
                return;
            }

            try {
                Mail::to($developerRecipients)->send(new ExceptionReported($throwable, request()));
            } catch (Throwable $mailException) {
                logger()->error('Failed to send exception report email to developers.', [
                    'mail_exception' => $mailException->getMessage(),
                ]);
            }
        });
    })->create();

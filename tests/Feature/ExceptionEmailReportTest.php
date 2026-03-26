<?php

use App\Mail\ExceptionReported;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;

it('parses multiple developer emails from env style separators', function () {
    putenv('EMAIL_DEVs=dev1@example.com, dev2@example.com|dev3@example.com;dev4@example.com');
    $_ENV['EMAIL_DEVs'] = 'dev1@example.com, dev2@example.com|dev3@example.com;dev4@example.com';
    $_SERVER['EMAIL_DEVs'] = 'dev1@example.com, dev2@example.com|dev3@example.com;dev4@example.com';

    $config = require base_path('config/mail.php');

    expect($config['developer_recipients'])->toBe([
        'dev1@example.com',
        'dev2@example.com',
        'dev3@example.com',
        'dev4@example.com',
    ]);
});

it('emails all developer recipients when a reportable website exception occurs', function () {
    Mail::fake();

    config()->set('mail.developer_recipients', [
        'dev1@example.com',
        'dev2@example.com',
    ]);

    Route::middleware('web')->get('/_test/exception-email-report', function (): never {
        throw new RuntimeException('Website error for developer report');
    });

    $this->withExceptionHandling()
        ->get('/_test/exception-email-report')
        ->assertStatus(500);

    Mail::assertSent(ExceptionReported::class, function (ExceptionReported $mail): bool {
        return $mail->hasTo('dev1@example.com')
            && $mail->hasTo('dev2@example.com')
            && $mail->throwable->getMessage() === 'Website error for developer report';
    });
});

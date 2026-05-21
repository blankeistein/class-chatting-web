<?php

use App\Mail\TestEmailMailable;
use App\Services\EmailConfigService;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\Mailer\Exception\TransportException;
use Tests\TestCase;

uses(TestCase::class);

test('sendTestEmail returns success response when email is sent', function () {
    Mail::fake();

    $service = new EmailConfigService;

    $result = $service->sendTestEmail('test@example.com');

    expect($result['success'])->toBeTrue();
    expect($result['message'])->toBe('Test email sent successfully');
    expect($result['sent_at'])->not->toBeNull();
    expect($result['error_type'])->toBeNull();

    Mail::assertSent(TestEmailMailable::class, function ($mailable) {
        return $mailable->hasTo('test@example.com');
    });
});

test('sendTestEmail returns failure with error categorization on timeout', function () {
    Mail::shouldReceive('to')
        ->once()
        ->andReturnSelf();
    Mail::shouldReceive('send')
        ->once()
        ->andThrow(new TransportException('Connection timed out'));

    $service = new EmailConfigService;

    $result = $service->sendTestEmail('test@example.com');

    expect($result['success'])->toBeFalse();
    expect($result['message'])->toContain('timed out');
    expect($result['sent_at'])->toBeNull();
    expect($result['error_type'])->toBe('timeout');
});

test('sendTestEmail returns failure with authentication_failed error type', function () {
    Mail::shouldReceive('to')
        ->once()
        ->andReturnSelf();
    Mail::shouldReceive('send')
        ->once()
        ->andThrow(new TransportException('535 Authentication failed'));

    $service = new EmailConfigService;

    $result = $service->sendTestEmail('test@example.com');

    expect($result['success'])->toBeFalse();
    expect($result['sent_at'])->toBeNull();
    expect($result['error_type'])->toBe('authentication_failed');
});

test('sendTestEmail returns failure with connection_refused error type', function () {
    Mail::shouldReceive('to')
        ->once()
        ->andReturnSelf();
    Mail::shouldReceive('send')
        ->once()
        ->andThrow(new TransportException('Connection refused (111)'));

    $service = new EmailConfigService;

    $result = $service->sendTestEmail('test@example.com');

    expect($result['success'])->toBeFalse();
    expect($result['sent_at'])->toBeNull();
    expect($result['error_type'])->toBe('connection_refused');
});

test('sendTestEmail returns failure with invalid_recipient error type', function () {
    Mail::shouldReceive('to')
        ->once()
        ->andReturnSelf();
    Mail::shouldReceive('send')
        ->once()
        ->andThrow(new TransportException('550 recipient rejected'));

    $service = new EmailConfigService;

    $result = $service->sendTestEmail('invalid@nonexistent.com');

    expect($result['success'])->toBeFalse();
    expect($result['sent_at'])->toBeNull();
    expect($result['error_type'])->toBe('invalid_recipient');
});

test('sendTestEmail sent_at format matches DD MMM YYYY HH:mm:ss', function () {
    Mail::fake();

    $service = new EmailConfigService;

    $result = $service->sendTestEmail('test@example.com');

    expect($result['sent_at'])->toMatch('/^\d{2} \w{3} \d{4} \d{2}:\d{2}:\d{2}$/');
});

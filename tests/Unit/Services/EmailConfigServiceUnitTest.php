<?php

use App\Services\EmailConfigService;
use Tests\TestCase;

uses(TestCase::class);

/*
|--------------------------------------------------------------------------
| getActiveConfig() - Mailer-specific config tests
|--------------------------------------------------------------------------
*/

test('getActiveConfig with SMTP mailer returns host, port, encryption, username, password_status', function () {
    config()->set('mail.default', 'smtp');
    config()->set('mail.mailers.smtp', [
        'transport' => 'smtp',
        'host' => 'smtp.mailtrap.io',
        'port' => 587,
        'scheme' => 'tls',
        'username' => 'abc123',
        'password' => 'secret',
    ]);
    config()->set('mail.from.address', 'noreply@app.test');
    config()->set('mail.from.name', 'App');

    $service = new EmailConfigService;
    $result = $service->getActiveConfig();

    expect($result['mailer'])->toBe('smtp')
        ->and($result['config'])->toHaveKeys(['host', 'port', 'encryption', 'username', 'password_status'])
        ->and($result['config']['host'])->toBe('smtp.mailtrap.io')
        ->and($result['config']['port'])->toBe(587)
        ->and($result['config']['encryption'])->toBe('tls')
        ->and($result['config']['username'])->toBe('abc123')
        ->and($result['config']['password_status'])->toBe('Configured');
});

test('getActiveConfig with SES mailer returns region', function () {
    config()->set('mail.default', 'ses');
    config()->set('mail.mailers.ses', ['transport' => 'ses']);
    config()->set('services.ses.region', 'ap-southeast-1');
    config()->set('mail.from.address', 'noreply@app.test');
    config()->set('mail.from.name', 'App');

    $service = new EmailConfigService;
    $result = $service->getActiveConfig();

    expect($result['mailer'])->toBe('ses')
        ->and($result['config'])->toHaveKeys(['region'])
        ->and($result['config']['region'])->toBe('ap-southeast-1');
});

test('getActiveConfig with Postmark mailer returns token_status', function () {
    config()->set('mail.default', 'postmark');
    config()->set('mail.mailers.postmark', ['transport' => 'postmark']);
    config()->set('services.postmark.token', 'pm-token-xyz');
    config()->set('mail.from.address', 'noreply@app.test');
    config()->set('mail.from.name', 'App');

    $service = new EmailConfigService;
    $result = $service->getActiveConfig();

    expect($result['mailer'])->toBe('postmark')
        ->and($result['config'])->toHaveKeys(['token_status'])
        ->and($result['config']['token_status'])->toBe('Configured');
});

test('getActiveConfig with Mailgun mailer returns domain and endpoint', function () {
    config()->set('mail.default', 'mailgun');
    config()->set('mail.mailers.mailgun', ['transport' => 'mailgun']);
    config()->set('services.mailgun.domain', 'mg.example.com');
    config()->set('services.mailgun.endpoint', 'api.eu.mailgun.net');
    config()->set('mail.from.address', 'noreply@app.test');
    config()->set('mail.from.name', 'App');

    $service = new EmailConfigService;
    $result = $service->getActiveConfig();

    expect($result['mailer'])->toBe('mailgun')
        ->and($result['config'])->toHaveKeys(['domain', 'endpoint'])
        ->and($result['config']['domain'])->toBe('mg.example.com')
        ->and($result['config']['endpoint'])->toBe('api.eu.mailgun.net');
});

test('getActiveConfig with log mailer returns transport', function () {
    config()->set('mail.default', 'log');
    config()->set('mail.mailers.log', ['transport' => 'log', 'channel' => 'mail']);
    config()->set('mail.from.address', 'noreply@app.test');
    config()->set('mail.from.name', 'App');

    $service = new EmailConfigService;
    $result = $service->getActiveConfig();

    expect($result['mailer'])->toBe('log')
        ->and($result['config'])->toHaveKeys(['transport'])
        ->and($result['config']['transport'])->toBe('log');
});

test('getActiveConfig with sendmail mailer returns transport', function () {
    config()->set('mail.default', 'sendmail');
    config()->set('mail.mailers.sendmail', ['transport' => 'sendmail', 'path' => '/usr/sbin/sendmail -bs -i']);
    config()->set('mail.from.address', 'noreply@app.test');
    config()->set('mail.from.name', 'App');

    $service = new EmailConfigService;
    $result = $service->getActiveConfig();

    expect($result['mailer'])->toBe('sendmail')
        ->and($result['config'])->toHaveKeys(['transport'])
        ->and($result['config']['transport'])->toBe('sendmail');
});

/*
|--------------------------------------------------------------------------
| Password masking logic
|--------------------------------------------------------------------------
*/

test('password masking: non-empty password returns Configured', function () {
    config()->set('mail.default', 'smtp');
    config()->set('mail.mailers.smtp', [
        'transport' => 'smtp',
        'host' => 'smtp.example.com',
        'port' => 587,
        'scheme' => 'tls',
        'username' => 'user',
        'password' => 'my-secret-password',
    ]);
    config()->set('mail.from.address', 'test@example.com');
    config()->set('mail.from.name', 'Test');

    $service = new EmailConfigService;
    $result = $service->getActiveConfig();

    expect($result['config']['password_status'])->toBe('Configured');
});

test('password masking: null password returns Not Configured', function () {
    config()->set('mail.default', 'smtp');
    config()->set('mail.mailers.smtp', [
        'transport' => 'smtp',
        'host' => 'smtp.example.com',
        'port' => 587,
        'scheme' => 'tls',
        'username' => 'user',
        'password' => null,
    ]);
    config()->set('mail.from.address', 'test@example.com');
    config()->set('mail.from.name', 'Test');

    $service = new EmailConfigService;
    $result = $service->getActiveConfig();

    expect($result['config']['password_status'])->toBe('Not Configured');
});

test('password masking: empty string password returns Not Configured', function () {
    config()->set('mail.default', 'smtp');
    config()->set('mail.mailers.smtp', [
        'transport' => 'smtp',
        'host' => 'smtp.example.com',
        'port' => 587,
        'scheme' => 'tls',
        'username' => 'user',
        'password' => '',
    ]);
    config()->set('mail.from.address', 'test@example.com');
    config()->set('mail.from.name', 'Test');

    $service = new EmailConfigService;
    $result = $service->getActiveConfig();

    expect($result['config']['password_status'])->toBe('Not Configured');
});

/*
|--------------------------------------------------------------------------
| Null/empty field handling
|--------------------------------------------------------------------------
*/

test('null fields return null in response', function () {
    config()->set('mail.default', 'smtp');
    config()->set('mail.mailers.smtp', [
        'transport' => 'smtp',
        'host' => null,
        'port' => null,
        'scheme' => null,
        'username' => null,
        'password' => 'secret',
    ]);
    config()->set('mail.from.address', null);
    config()->set('mail.from.name', null);

    $service = new EmailConfigService;
    $result = $service->getActiveConfig();

    expect($result['config']['host'])->toBeNull()
        ->and($result['config']['port'])->toBeNull()
        ->and($result['config']['encryption'])->toBeNull()
        ->and($result['config']['username'])->toBeNull()
        ->and($result['from']['address'])->toBeNull()
        ->and($result['from']['name'])->toBeNull();
});

test('empty string fields return null in response', function () {
    config()->set('mail.default', 'smtp');
    config()->set('mail.mailers.smtp', [
        'transport' => 'smtp',
        'host' => '',
        'port' => '',
        'scheme' => '',
        'username' => '',
        'password' => 'secret',
    ]);
    config()->set('mail.from.address', '');
    config()->set('mail.from.name', '');

    $service = new EmailConfigService;
    $result = $service->getActiveConfig();

    expect($result['config']['host'])->toBeNull()
        ->and($result['config']['port'])->toBeNull()
        ->and($result['config']['encryption'])->toBeNull()
        ->and($result['config']['username'])->toBeNull()
        ->and($result['from']['address'])->toBeNull()
        ->and($result['from']['name'])->toBeNull();
});

/*
|--------------------------------------------------------------------------
| checkSmtpConnection() - validation errors
|--------------------------------------------------------------------------
*/

test('checkSmtpConnection returns error when host is empty', function () {
    config()->set('mail.mailers.smtp.host', '');
    config()->set('mail.mailers.smtp.port', 587);

    $service = new EmailConfigService;
    $result = $service->checkSmtpConnection();

    expect($result['status'])->toBe('failed')
        ->and($result['error'])->toBe('SMTP host and port must be configured')
        ->and($result['response_time_ms'])->toBe(0);
});

test('checkSmtpConnection returns error when port is empty', function () {
    config()->set('mail.mailers.smtp.host', 'smtp.example.com');
    config()->set('mail.mailers.smtp.port', '');

    $service = new EmailConfigService;
    $result = $service->checkSmtpConnection();

    expect($result['status'])->toBe('failed')
        ->and($result['error'])->toBe('SMTP host and port must be configured')
        ->and($result['response_time_ms'])->toBe(0);
});

/*
|--------------------------------------------------------------------------
| Error categorization - categorizeSmtpError
|--------------------------------------------------------------------------
*/

test('error categorization: timeout message returns timeout', function () {
    $service = new EmailConfigService;
    $reflection = new ReflectionMethod($service, 'categorizeSmtpError');
    $reflection->setAccessible(true);

    $exception = new RuntimeException('Connection timed out after 10 seconds');
    $result = $reflection->invoke($service, $exception);

    expect($result)->toBe('timeout');
});

test('error categorization: authentication message returns authentication_failed', function () {
    $service = new EmailConfigService;
    $reflection = new ReflectionMethod($service, 'categorizeSmtpError');
    $reflection->setAccessible(true);

    $exception = new RuntimeException('535 Authentication credentials invalid');
    $result = $reflection->invoke($service, $exception);

    expect($result)->toBe('authentication_failed');
});

test('error categorization: connection refused returns connection_refused', function () {
    $service = new EmailConfigService;
    $reflection = new ReflectionMethod($service, 'categorizeSmtpError');
    $reflection->setAccessible(true);

    $exception = new RuntimeException('Connection refused on port 587');
    $result = $reflection->invoke($service, $exception);

    expect($result)->toBe('connection_refused');
});

test('error categorization: DNS resolution failure returns dns_resolution_failed', function () {
    $service = new EmailConfigService;
    $reflection = new ReflectionMethod($service, 'categorizeSmtpError');
    $reflection->setAccessible(true);

    $exception = new RuntimeException('getaddrinfo: Name or service not known');
    $result = $reflection->invoke($service, $exception);

    expect($result)->toBe('dns_resolution_failed');
});

test('error categorization: SSL/TLS error returns tls_ssl_error', function () {
    $service = new EmailConfigService;
    $reflection = new ReflectionMethod($service, 'categorizeSmtpError');
    $reflection->setAccessible(true);

    $exception = new RuntimeException('SSL certificate verify failed');
    $result = $reflection->invoke($service, $exception);

    expect($result)->toBe('tls_ssl_error');
});

test('error categorization: unknown error defaults to connection_refused', function () {
    $service = new EmailConfigService;
    $reflection = new ReflectionMethod($service, 'categorizeSmtpError');
    $reflection->setAccessible(true);

    $exception = new RuntimeException('Something completely unexpected happened');
    $result = $reflection->invoke($service, $exception);

    expect($result)->toBe('connection_refused');
});

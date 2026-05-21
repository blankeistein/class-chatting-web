<?php

use App\Services\EmailConfigService;
use Tests\TestCase;

uses(TestCase::class);

/**
 * Property 2: Mailer-specific fields completeness
 *
 * For each supported mailer type, the config response SHALL contain exactly the set of fields
 * specified for that mailer type. All mailers include from address and from name.
 *
 * Validates: Requirements 1.2, 1.4
 */
test('mailer-specific fields completeness', function (string $mailerType, array $expectedConfigKeys) {
    // Arrange: set the mail config for this mailer type
    config()->set('mail.default', $mailerType);
    config()->set("mail.mailers.{$mailerType}", buildMailerConfig($mailerType));
    config()->set('mail.from.address', 'test@example.com');
    config()->set('mail.from.name', 'Test Sender');

    // Also set service configs for mailers that read from services.*
    config()->set('services.ses.region', 'us-east-1');
    config()->set('services.postmark.token', 'test-token');
    config()->set('services.mailgun.domain', 'mg.example.com');
    config()->set('services.mailgun.endpoint', 'api.mailgun.net');

    $service = new EmailConfigService;

    // Act
    $result = $service->getActiveConfig();

    // Assert: response has the top-level keys
    expect($result)->toHaveKeys(['mailer', 'config', 'from']);

    // Assert: mailer matches
    expect($result['mailer'])->toBe($mailerType);

    // Assert: from.address and from.name are always present
    expect($result['from'])->toHaveKeys(['address', 'name']);

    // Assert: config contains EXACTLY the expected keys (no more, no less)
    $actualConfigKeys = array_keys($result['config']);
    sort($actualConfigKeys);
    $sortedExpected = $expectedConfigKeys;
    sort($sortedExpected);

    expect($actualConfigKeys)->toBe($sortedExpected)
        ->and(count($actualConfigKeys))->toBe(count($expectedConfigKeys));
})->with([
    'smtp' => ['smtp', ['host', 'port', 'encryption', 'username', 'password_status']],
    'ses' => ['ses', ['region']],
    'postmark' => ['postmark', ['token_status']],
    'mailgun' => ['mailgun', ['domain', 'endpoint']],
    'log' => ['log', ['transport']],
    'sendmail' => ['sendmail', ['transport']],
    'array' => ['array', ['transport']],
])->group('Feature: email-config-checker', 'Property 2: Mailer-specific fields completeness')
    ->repeat(100);

/**
 * Build a realistic mailer config array for the given mailer type.
 */
function buildMailerConfig(string $mailerType): array
{
    return match ($mailerType) {
        'smtp' => [
            'transport' => 'smtp',
            'host' => 'smtp.example.com',
            'port' => 587,
            'scheme' => 'tls',
            'username' => 'user@example.com',
            'password' => 'secret123',
        ],
        'ses' => [
            'transport' => 'ses',
        ],
        'postmark' => [
            'transport' => 'postmark',
        ],
        'mailgun' => [
            'transport' => 'mailgun',
        ],
        'log' => [
            'transport' => 'log',
            'channel' => 'mail',
        ],
        'sendmail' => [
            'transport' => 'sendmail',
            'path' => '/usr/sbin/sendmail -bs -i',
        ],
        'array' => [
            'transport' => 'array',
        ],
        default => [
            'transport' => $mailerType,
        ],
    };
}

/**
 * Property 5: Error categorization for send failures
 *
 * For any exception thrown during email sending, the system SHALL categorize it into exactly one
 * of the defined error types (timeout, authentication_failed, connection_refused,
 * dns_resolution_failed, tls_ssl_error) and return a descriptive error message containing
 * that categorization. The categorization is deterministic.
 *
 * Validates: Requirements 2.6, 3.5
 */
test('error categorization for send failures', function (string $errorMessage) {
    $service = new EmailConfigService;

    // Use reflection to access the private categorizeSmtpError method
    $reflection = new ReflectionMethod($service, 'categorizeSmtpError');
    $reflection->setAccessible(true);

    $exception = new RuntimeException($errorMessage);

    $validErrorTypes = [
        'timeout',
        'authentication_failed',
        'connection_refused',
        'dns_resolution_failed',
        'tls_ssl_error',
    ];

    // Act: categorize the error
    $result = $reflection->invoke($service, $exception);

    // Assert: result is exactly one of the defined error types
    expect($result)->toBeIn($validErrorTypes);

    // Assert: deterministic - same input always produces same output
    $secondResult = $reflection->invoke($service, $exception);
    expect($secondResult)->toBe($result);
})->with(function () {
    // Keywords that map to specific error types
    $timeoutKeywords = ['timeout', 'timed out', 'Connection timeout occurred', 'SMTP server timed out'];
    $authKeywords = ['authentication', '535', 'Authentication failed for user', '535 5.7.8 Error'];
    $connectionRefusedKeywords = ['connection refused', '111', 'Connection refused by host', 'errno 111'];
    $dnsKeywords = ['getaddrinfo', 'resolve', 'Could not resolve host', 'getaddrinfo failed'];
    $tlsKeywords = ['ssl', 'tls', 'SSL certificate problem', 'TLS handshake failed'];

    // Random strings that should fall into default category
    $randomStrings = [
        'Unknown error occurred',
        'Something went wrong',
        'Unexpected server response',
        'Mail delivery failed',
        'SMTP protocol error',
        'Server returned error code 500',
        'Network unreachable',
        'Broken pipe',
        'End of file',
        'Permission denied',
        'Resource temporarily unavailable',
        'No route to host',
        'Operation not permitted',
        'Socket error',
        'Buffer overflow',
    ];

    // Mixed case variations
    $mixedCaseVariations = [
        'TIMEOUT while connecting',
        'Connection TIMED OUT',
        'AUTHENTICATION required',
        'Error 535 auth failed',
        'CONNECTION REFUSED on port 25',
        'Error code 111 returned',
        'GETADDRINFO lookup failed',
        'Cannot RESOLVE hostname',
        'SSL_ERROR_HANDSHAKE',
        'TLS_PROTOCOL_ERROR',
    ];

    // Messages with keywords embedded in longer strings
    $embeddedKeywords = [
        'smtp.example.com: timeout after 10 seconds',
        'server timed out waiting for response',
        'authentication credentials rejected by server',
        'error 535 invalid credentials',
        'tcp connection refused on port 587',
        'errno=111 cannot connect',
        'getaddrinfo: Name or service not known',
        'failed to resolve dns for smtp.test.com',
        'ssl certificate verify failed',
        'tls version mismatch detected',
    ];

    $allMessages = array_merge(
        $timeoutKeywords,
        $authKeywords,
        $connectionRefusedKeywords,
        $dnsKeywords,
        $tlsKeywords,
        $randomStrings,
        $mixedCaseVariations,
        $embeddedKeywords,
    );

    // Yield at least 100 dataset entries
    $datasets = [];
    foreach ($allMessages as $index => $message) {
        $datasets["error message #{$index}: ".substr($message, 0, 40)] = [$message];
    }

    // Add more random variations to ensure we exceed 100 iterations
    $prefixes = ['Error: ', 'Fatal: ', 'Warning: ', 'SMTP: ', 'Mail: '];
    $suffixes = [' (retried 3 times)', ' on port 587', ' for host smtp.test.com', ' after 5 attempts', ''];
    $baseKeywords = ['timeout', 'timed out', 'authentication', '535', 'connection refused', '111', 'getaddrinfo', 'resolve', 'ssl', 'tls'];

    $extraIndex = count($allMessages);
    foreach ($prefixes as $prefix) {
        foreach ($baseKeywords as $keyword) {
            $suffix = $suffixes[array_rand($suffixes)];
            $msg = $prefix.$keyword.$suffix;
            $datasets["error message #{$extraIndex}: ".substr($msg, 0, 40)] = [$msg];
            $extraIndex++;
        }
    }

    return $datasets;
})->group('Feature: email-config-checker', 'Property 5: Error categorization for send failures');

/**
 * Property 3: Null/empty fields display "Not Set"
 *
 * For any configuration field that has a null or empty string value, the response SHALL include
 * that field with a null value (rendered as "Not Set" on frontend), and for any field with a
 * non-empty value, the response SHALL include the actual value.
 *
 * Validates: Requirements 1.5
 */
test('null or empty fields return null and non-empty fields return actual value', function (array $fieldValues) {
    // Arrange: set up SMTP mailer with the generated field values
    config()->set('mail.default', 'smtp');
    config()->set('mail.mailers.smtp', [
        'transport' => 'smtp',
        'host' => $fieldValues['host'],
        'port' => $fieldValues['port'],
        'scheme' => $fieldValues['encryption'],
        'username' => $fieldValues['username'],
        'password' => 'secret',
    ]);
    config()->set('mail.from.address', $fieldValues['from_address']);
    config()->set('mail.from.name', $fieldValues['from_name']);

    $service = new EmailConfigService;

    // Act
    $result = $service->getActiveConfig();

    // Assert: for each field, null/empty input => null output, non-empty input => actual value
    $fieldMappings = [
        'host' => $result['config']['host'],
        'username' => $result['config']['username'],
        'encryption' => $result['config']['encryption'],
        'from_address' => $result['from']['address'],
        'from_name' => $result['from']['name'],
    ];

    foreach ($fieldMappings as $fieldName => $actualOutput) {
        $inputValue = $fieldValues[$fieldName];

        if ($inputValue === null || $inputValue === '') {
            expect($actualOutput)->toBeNull(
                "Field '{$fieldName}' with input ".var_export($inputValue, true).' should return null'
            );
        } else {
            expect($actualOutput)->toBe($inputValue,
                "Field '{$fieldName}' with non-empty input should return the actual value"
            );
        }
    }

    // Port has special handling: null/empty => null, non-empty => integer cast
    $portInput = $fieldValues['port'];
    $portOutput = $result['config']['port'];

    if ($portInput === null || $portInput === '') {
        expect($portOutput)->toBeNull('Port with null/empty input should return null');
    } else {
        expect($portOutput)->toBe((int) $portInput, 'Port with non-empty input should return integer value');
    }
})->with(function () {
    $possibleValues = function (): array {
        $nullOrEmpty = [null, ''];
        $nonEmpty = [
            'smtp.example.com',
            'mail.test.org',
            'localhost',
            'user@example.com',
            'Test Sender',
            'admin',
            '587',
            '465',
            '25',
            'tls',
            'ssl',
        ];

        return array_merge($nullOrEmpty, $nonEmpty);
    };

    $datasets = [];

    for ($i = 0; $i < 100; $i++) {
        $values = $possibleValues();

        $datasets["iteration {$i}"] = [
            [
                'host' => $values[array_rand($values)],
                'port' => $values[array_rand($values)],
                'encryption' => $values[array_rand($values)],
                'username' => $values[array_rand($values)],
                'from_address' => $values[array_rand($values)],
                'from_name' => $values[array_rand($values)],
            ],
        ];
    }

    return $datasets;
})->group('Feature: email-config-checker', 'Property 3: Null/empty fields display "Not Set"');

/**
 * Property 1: Password never exposed in config response
 *
 * For any mail configuration with any password value (including empty string, null, or any
 * non-empty string), the response returned by getActiveConfig() SHALL never contain the actual
 * password value — only a status indicator ("Configured" or "Not Configured").
 *
 * Validates: Requirements 1.3, 4.2
 */
test('password never exposed in config response', function (mixed $password) {
    // Arrange: set the mail config with the given password
    config()->set('mail.default', 'smtp');
    config()->set('mail.mailers.smtp', [
        'transport' => 'smtp',
        'host' => 'smtp.example.com',
        'port' => 587,
        'scheme' => 'tls',
        'username' => 'user@example.com',
        'password' => $password,
    ]);
    config()->set('mail.from.address', 'sender@example.com');
    config()->set('mail.from.name', 'Test Sender');

    $service = new EmailConfigService;

    // Act
    $result = $service->getActiveConfig();

    // Assert: password_status is only "Configured" or "Not Configured"
    expect($result['config']['password_status'])->toBeIn(['Configured', 'Not Configured']);

    // Assert: if password is non-empty, the actual password value must NOT appear anywhere in the response
    // We exclude the password_status field since it legitimately contains "Configured"/"Not Configured"
    if ($password !== null && $password !== '') {
        $configWithoutPasswordStatus = $result;
        unset($configWithoutPasswordStatus['config']['password_status']);

        $flatValues = flattenArrayValues($configWithoutPasswordStatus);

        foreach ($flatValues as $value) {
            expect((string) $value)->not->toBe((string) $password,
                "Actual password value '{$password}' was found in the config response"
            );
        }
    }

    // Assert: password_status correctly reflects whether password is configured
    if ($password === null || $password === '') {
        expect($result['config']['password_status'])->toBe('Not Configured');
    } else {
        expect($result['config']['password_status'])->toBe('Configured');
    }
})->with(generatePasswordDataset())
    ->group('Feature: email-config-checker', 'Property 1: Password never exposed in config response');

/**
 * Recursively flatten all values from a nested array into a flat list.
 */
function flattenArrayValues(array $array): array
{
    $values = [];

    array_walk_recursive($array, function ($value) use (&$values) {
        $values[] = $value;
    });

    return $values;
}

/**
 * Generate a dataset of at least 100 password values for property testing.
 * Includes null, empty string, and random non-empty strings of various lengths.
 */
function generatePasswordDataset(): array
{
    $dataset = [];

    // Edge cases: null and empty string (repeated to ensure coverage)
    $dataset['null password'] = [null];
    $dataset['empty string password'] = [''];

    // Short passwords
    for ($i = 1; $i <= 10; $i++) {
        $dataset["short password (length {$i})"] = [generateRandomString($i)];
    }

    // Medium passwords (10-50 chars)
    for ($i = 0; $i < 30; $i++) {
        $length = rand(10, 50);
        $dataset["medium password #{$i} (length {$length})"] = [generateRandomString($length)];
    }

    // Long passwords (50-200 chars)
    for ($i = 0; $i < 20; $i++) {
        $length = rand(50, 200);
        $dataset["long password #{$i} (length {$length})"] = [generateRandomString($length)];
    }

    // Passwords with special characters
    $specialChars = ['!@#$%^&*()', 'p@$$w0rd!', '<script>alert("xss")</script>', "pass'word", 'pass"word', 'pass\\word', 'pass/word'];
    foreach ($specialChars as $idx => $special) {
        $dataset["special chars #{$idx}"] = [$special];
    }

    // Passwords that look like status indicators (adversarial)
    $adversarial = ['Configured', 'Not Configured', 'configured', 'NOT CONFIGURED', 'true', 'false', '0', '1'];
    foreach ($adversarial as $idx => $adv) {
        $dataset["adversarial #{$idx}: {$adv}"] = [$adv];
    }

    // Unicode passwords
    $unicode = ['пароль123', '密码测试', 'パスワード', '🔑🔒secret', 'café☕pass'];
    foreach ($unicode as $idx => $uni) {
        $dataset["unicode #{$idx}"] = [$uni];
    }

    // Fill remaining to reach 100+ entries with random strings
    $remaining = 100 - count($dataset);
    for ($i = 0; $i < max(0, $remaining); $i++) {
        $length = rand(1, 128);
        $dataset["random #{$i} (length {$length})"] = [generateRandomString($length)];
    }

    return $dataset;
}

/**
 * Generate a random string of the given length using printable ASCII characters.
 */
function generateRandomString(int $length): string
{
    $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}|;:,.<>?/~`';
    $result = '';

    for ($i = 0; $i < $length; $i++) {
        $result .= $chars[rand(0, strlen($chars) - 1)];
    }

    return $result;
}

<?php

use App\Models\User;
use App\Services\EmailConfigService;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(LazilyRefreshDatabase::class);

beforeEach(function () {
    // Override the DB_DATABASE env since phpunit.xml sets it to :memory: for SQLite
    // but SQLite driver is not available, so we use MySQL instead
    config()->set('database.default', 'mysql');
    config()->set('database.connections.mysql.database', 'app_lestariilmu_id');

    // Reconnect with the correct database
    DB::purge('mysql');
});

/**
 * Property 4: Email validation correctness
 *
 * For any string input, the email validation SHALL accept the string if and only if it conforms
 * to RFC 5322 format (contains local-part, @ symbol, and domain) and has length ≤ 254 characters.
 * Invalid inputs SHALL be rejected with an appropriate error message.
 *
 * Validates: Requirements 2.2, 2.3
 */
test('valid emails are accepted by send-test endpoint', function (string $email) {
    // Mock the service to avoid actual email sending
    $this->mock(EmailConfigService::class, function ($mock) {
        $mock->shouldReceive('sendTestEmail')
            ->andReturn([
                'success' => true,
                'message' => 'Test email sent successfully',
                'sent_at' => now()->format('d M Y H:i:s'),
                'error_type' => null,
            ]);
    });

    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $response = $this
        ->actingAs($admin)
        ->postJson(route('admin.email-config.send-test'), [
            'email' => $email,
        ]);

    // Valid emails should NOT return a 422 validation error for the email field
    expect($response->status())->not->toBe(422,
        "Valid email '{$email}' was rejected with 422 validation error"
    );
})->with(generateValidEmailDataset())
    ->group('Feature: email-config-checker', 'Property 4: Email validation correctness');

test('invalid emails are rejected by send-test endpoint', function (string $email) {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $response = $this
        ->actingAs($admin)
        ->postJson(route('admin.email-config.send-test'), [
            'email' => $email,
        ]);

    // Invalid emails MUST return a 422 validation error
    $response->assertStatus(422);
    $response->assertJsonValidationErrors('email');
})->with(generateInvalidEmailDataset())
    ->group('Feature: email-config-checker', 'Property 4: Email validation correctness');

/**
 * Generate a dataset of valid email strings (RFC 5322 compliant, ≤254 chars).
 *
 * @return array<string, array{0: string}>
 */
function generateValidEmailDataset(): array
{
    $dataset = [];

    // Simple valid emails
    $simpleEmails = [
        'user@example.com',
        'admin@domain.org',
        'test@mail.co.id',
        'hello@world.net',
        'info@company.io',
    ];

    foreach ($simpleEmails as $idx => $email) {
        $dataset["simple #{$idx}: {$email}"] = [$email];
    }

    // Emails with dots in local part
    $dotEmails = [
        'first.last@example.com',
        'user.name.extra@domain.org',
        'a.b.c.d@test.com',
        'john.doe@mail.co.uk',
        'my.email.address@sub.domain.com',
    ];

    foreach ($dotEmails as $idx => $email) {
        $dataset["dots #{$idx}: {$email}"] = [$email];
    }

    // Emails with plus addressing
    $plusEmails = [
        'user+tag@example.com',
        'admin+test@domain.org',
        'name+filter+extra@mail.com',
        'test+123@example.co.id',
        'user+newsletter@company.io',
    ];

    foreach ($plusEmails as $idx => $email) {
        $dataset["plus #{$idx}: {$email}"] = [$email];
    }

    // Emails with subdomains
    $subdomainEmails = [
        'user@mail.example.com',
        'admin@smtp.server.org',
        'test@a.b.c.d.example.com',
        'info@sub1.sub2.domain.co.uk',
        'hello@deep.nested.subdomain.test.com',
    ];

    foreach ($subdomainEmails as $idx => $email) {
        $dataset["subdomain #{$idx}: {$email}"] = [$email];
    }

    // Emails with numbers
    $numberEmails = [
        'user123@example.com',
        '123user@domain.org',
        'test456test@mail.com',
        'a1b2c3@numbers.io',
        'user@server123.com',
    ];

    foreach ($numberEmails as $idx => $email) {
        $dataset["numbers #{$idx}: {$email}"] = [$email];
    }

    // Emails with hyphens in domain
    $hyphenEmails = [
        'user@my-domain.com',
        'admin@test-server.org',
        'test@sub-domain.example.com',
        'info@long-hyphenated-domain.co.uk',
        'hello@a-b-c.test.com',
    ];

    foreach ($hyphenEmails as $idx => $email) {
        $dataset["hyphens #{$idx}: {$email}"] = [$email];
    }

    // Emails with underscores and special chars in local part
    $specialLocalEmails = [
        'user_name@example.com',
        'first-last@domain.org',
        'test_user-name@mail.com',
        'a_b-c@test.io',
        'under_score@example.co.id',
    ];

    foreach ($specialLocalEmails as $idx => $email) {
        $dataset["special local #{$idx}: {$email}"] = [$email];
    }

    // Long but valid emails (under 254 chars)
    $dataset['long email 100 chars'] = ['user.name.with.many.dots.and.segments+tag@subdomain.example-server.co.uk'];
    $dataset['long email 150 chars'] = [str_repeat('a', 50).'+tag@'.str_repeat('b', 20).'.'.str_repeat('c', 20).'.'.str_repeat('d', 20).'.example.com'];
    $dataset['long local part'] = [str_repeat('x', 60).'@example.com'];

    // Generate more random valid emails to reach 60+ entries
    $localParts = ['user', 'admin', 'test', 'info', 'hello', 'contact', 'support', 'sales', 'dev', 'ops'];
    $domains = ['example.com', 'test.org', 'mail.co.id', 'domain.net', 'company.io', 'server.co.uk'];
    $separators = ['.', '+', '_', '-'];

    for ($i = 0; $i < 25; $i++) {
        $local = $localParts[array_rand($localParts)];
        $sep = $separators[array_rand($separators)];
        $suffix = $localParts[array_rand($localParts)];
        $domain = $domains[array_rand($domains)];
        $email = $local.$sep.$suffix.rand(1, 999).'@'.$domain;
        $dataset["generated valid #{$i}"] = [$email];
    }

    return $dataset;
}

/**
 * Generate a dataset of invalid email strings.
 *
 * @return array<string, array{0: string}>
 */
function generateInvalidEmailDataset(): array
{
    $dataset = [];

    // Missing @ symbol
    $missingAt = [
        'userexample.com',
        'admindomain.org',
        'testmail.com',
        'nodomain',
        'just.a.string',
    ];

    foreach ($missingAt as $idx => $email) {
        $dataset["missing @ #{$idx}"] = [$email];
    }

    // Missing domain
    $missingDomain = [
        'user@',
        'admin@',
        'test@',
    ];

    foreach ($missingDomain as $idx => $email) {
        $dataset["missing domain #{$idx}"] = [$email];
    }

    // Missing local part
    $missingLocal = [
        '@example.com',
        '@domain.org',
        '@mail.com',
    ];

    foreach ($missingLocal as $idx => $email) {
        $dataset["missing local #{$idx}"] = [$email];
    }

    // Too long (>254 chars) - must actually exceed 254 total length
    $dataset['too long #1 (255 chars)'] = [str_repeat('a', 243).'@example.com']; // 243+1+11 = 255
    $dataset['too long #2 (300 chars)'] = ['user@'.str_repeat('b', 50).'.'.str_repeat('c', 50).'.'.str_repeat('d', 50).'.'.str_repeat('e', 50).'.'.str_repeat('f', 50).'.'.str_repeat('g', 50).'.com']; // well over 254
    $dataset['too long #3 (400 chars)'] = [str_repeat('h', 200).'@'.str_repeat('i', 50).'.'.str_repeat('j', 50).'.'.str_repeat('k', 50).'.example.com']; // 200+1+50+1+50+1+50+1+11 = 365
    $dataset['too long #4 (500 chars)'] = [str_repeat('l', 250).'@'.str_repeat('m', 50).'.'.str_repeat('n', 50).'.'.str_repeat('o', 50).'.'.str_repeat('p', 50).'.example.com']; // 250+1+50+1+50+1+50+1+50+1+11 = 466
    $dataset['too long #5 (260 chars)'] = [str_repeat('q', 125).'@'.str_repeat('r', 60).'.'.str_repeat('s', 60).'.example.com']; // 125+1+60+1+60+1+11 = 259

    // Empty string
    $dataset['empty string'] = [''];

    // Spaces in email (internal spaces that aren't trimmed by middleware)
    $spacesEmails = [
        'user@ example.com',
        'us er@example.com',
        'user @domain .com',
        'u s e r@example.com',
        'user@exam ple.com',
    ];

    foreach ($spacesEmails as $idx => $email) {
        $dataset["spaces #{$idx}"] = [$email];
    }

    // Double @ symbol
    $doubleAt = [
        'user@@example.com',
        'admin@domain@org',
        '@@example.com',
    ];

    foreach ($doubleAt as $idx => $email) {
        $dataset["double @ #{$idx}"] = [$email];
    }

    // Invalid domain formats
    $invalidDomains = [
        'user@.com',
        'user@example.',
        'user@.example.com',
        'user@example..com',
        'user@-example.com',
    ];

    foreach ($invalidDomains as $idx => $email) {
        $dataset["invalid domain #{$idx}"] = [$email];
    }

    // Special characters not allowed in standard validation
    $invalidChars = [
        'user<>@example.com',
        'user[]@example.com',
        'user;:@example.com',
        'user,name@example.com',
        'user name@example.com',
    ];

    foreach ($invalidChars as $idx => $email) {
        $dataset["invalid chars #{$idx}"] = [$email];
    }

    // Just whitespace
    $dataset['only spaces'] = ['   '];
    $dataset['tab character'] = ["\t"];
    $dataset['newline'] = ["\n"];

    // Random invalid strings
    $randomInvalid = [
        'not-an-email',
        '12345',
        'http://example.com',
        '@@@',
        '..@...',
    ];

    foreach ($randomInvalid as $idx => $email) {
        $dataset["random invalid #{$idx}"] = [$email];
    }

    return $dataset;
}

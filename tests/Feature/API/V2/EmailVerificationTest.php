<?php

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\RateLimiter;
use Kreait\Firebase\Exception\Auth\FailedToVerifyToken;
use Kreait\Firebase\JWT\Contract\Token as ContractToken;
use Kreait\Laravel\Firebase\Facades\Firebase;

uses(RefreshDatabase::class);

function mockValidFirebaseTokenForEmailVerification(string $uid = 'firebase-user-verify-001'): void
{
    $verifiedToken = Mockery::mock(ContractToken::class);
    $claims = Mockery::mock();
    $claims->shouldReceive('get')->once()->with('sub')->andReturn($uid);
    $verifiedToken->shouldReceive('claims')->once()->andReturn($claims);

    $auth = Mockery::mock();
    $auth->shouldReceive('verifyIdToken')
        ->once()
        ->with('valid-firebase-token', false, 5)
        ->andReturn($verifiedToken);

    Firebase::shouldReceive('auth')->andReturn($auth);
}

it('rejects email verification requests without a firebase bearer token', function () {
    $this->postJson('/api/v2/email/verification-notification')
        ->assertUnauthorized()
        ->assertJson([
            'status' => false,
            'errorCode' => 401,
            'version' => 2,
        ]);
});

it('rejects email verification requests with an invalid firebase bearer token', function () {
    $auth = Mockery::mock();
    $auth->shouldReceive('verifyIdToken')
        ->once()
        ->with('invalid-firebase-token', false, 5)
        ->andThrow(new FailedToVerifyToken('Invalid token'));

    Firebase::shouldReceive('auth')->once()->andReturn($auth);

    $this
        ->withHeader('Authorization', 'Bearer invalid-firebase-token')
        ->postJson('/api/v2/email/verification-notification')
        ->assertUnauthorized()
        ->assertJson([
            'status' => false,
            'errorCode' => 401,
            'version' => 2,
        ]);
});

it('rejects when the firebase user is not found or inactive', function () {
    mockValidFirebaseTokenForEmailVerification('missing-firebase-user');

    $this
        ->withHeader('Authorization', 'Bearer valid-firebase-token')
        ->postJson('/api/v2/email/verification-notification')
        ->assertUnauthorized()
        ->assertJson([
            'status' => false,
            'errorCode' => 401,
            'message' => 'Pengguna tidak ditemukan atau tidak aktif.',
            'version' => 2,
        ]);
});

it('returns success without sending when email is already verified', function () {
    Notification::fake();

    $user = User::factory()->create([
        'email' => 'verified@example.com',
        'firebase_uid' => 'firebase-user-verify-001',
        'email_verified_at' => now(),
        'is_active' => true,
    ]);

    mockValidFirebaseTokenForEmailVerification($user->firebase_uid);

    $this
        ->withHeader('Authorization', 'Bearer valid-firebase-token')
        ->postJson('/api/v2/email/verification-notification')
        ->assertSuccessful()
        ->assertJson([
            'status' => true,
            'message' => 'Email sudah terverifikasi.',
            'data' => [
                'email' => 'verified@example.com',
                'already_verified' => true,
                'sent' => false,
            ],
            'version' => 2,
        ]);

    Notification::assertNothingSent();
});

it('sends a verification link for unverified users', function () {
    Notification::fake();

    $user = User::factory()->unverified()->create([
        'email' => 'unverified@example.com',
        'firebase_uid' => 'firebase-user-verify-001',
        'is_active' => true,
    ]);

    mockValidFirebaseTokenForEmailVerification($user->firebase_uid);

    $this
        ->withHeader('Authorization', 'Bearer valid-firebase-token')
        ->postJson('/api/v2/email/verification-notification')
        ->assertSuccessful()
        ->assertJson([
            'status' => true,
            'message' => 'Link verifikasi telah dikirim ke email kamu.',
            'data' => [
                'email' => 'unverified@example.com',
                'already_verified' => false,
                'sent' => true,
                'retry_after_seconds' => 300,
            ],
            'version' => 2,
        ]);

    Notification::assertSentTo($user, VerifyEmail::class);
});

it('rate limits resending verification links every 5 minutes', function () {
    Notification::fake();

    $user = User::factory()->unverified()->create([
        'email' => 'rate-limited@example.com',
        'firebase_uid' => 'firebase-user-verify-001',
        'is_active' => true,
    ]);

    RateLimiter::clear('verify-email:'.$user->id);
    RateLimiter::hit('verify-email:'.$user->id, 300);

    mockValidFirebaseTokenForEmailVerification($user->firebase_uid);

    $this
        ->withHeader('Authorization', 'Bearer valid-firebase-token')
        ->postJson('/api/v2/email/verification-notification')
        ->assertStatus(429)
        ->assertJson([
            'status' => false,
            'errorCode' => 429,
            'version' => 2,
        ])
        ->assertJsonPath('message', fn (string $message) => str_contains($message, '5 menit'));

    Notification::assertNothingSent();
});

<?php

use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Kreait\Firebase\Auth;
use Kreait\Laravel\Firebase\Facades\Firebase;

uses(RefreshDatabase::class);

function mockFirebasePasswordSyncForReset(string $firebaseUid = 'firebase-reset-uid'): void
{
    $auth = Mockery::mock(Auth::class);
    $auth->shouldReceive('getUser')->once()->with($firebaseUid)->andReturn(Mockery::mock());
    $auth->shouldReceive('changeUserPassword')->once()->with($firebaseUid, 'newPassword123');

    Firebase::shouldReceive('auth')->once()->andReturn($auth);
}

it('validates email is required when requesting password reset link', function () {
    $this->postJson('/api/v2/password/forgot', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});

it('validates email format when requesting password reset link', function () {
    $this->postJson('/api/v2/password/forgot', [
        'email' => 'not-an-email',
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});

it('returns a generic success response when email is not registered', function () {
    Notification::fake();

    $this->postJson('/api/v2/password/forgot', [
        'email' => 'missing@example.com',
    ])
        ->assertSuccessful()
        ->assertJson([
            'status' => true,
            'message' => 'Jika email terdaftar, link ubah password telah dikirim.',
            'data' => [
                'email' => 'missing@example.com',
            ],
            'version' => 2,
        ]);

    Notification::assertNothingSent();
});

it('returns a generic success response when user is inactive and does not send email', function () {
    Notification::fake();

    User::factory()->create([
        'email' => 'inactive@example.com',
        'is_active' => false,
    ]);

    $this->postJson('/api/v2/password/forgot', [
        'email' => 'inactive@example.com',
    ])
        ->assertSuccessful()
        ->assertJson([
            'status' => true,
            'message' => 'Jika email terdaftar, link ubah password telah dikirim.',
            'data' => [
                'email' => 'inactive@example.com',
            ],
            'version' => 2,
        ]);

    Notification::assertNothingSent();
});

it('sends a password reset link for an active user', function () {
    Notification::fake();

    $user = User::factory()->create([
        'email' => 'active@example.com',
        'is_active' => true,
    ]);

    $this->postJson('/api/v2/password/forgot', [
        'email' => 'active@example.com',
    ])
        ->assertSuccessful()
        ->assertJson([
            'status' => true,
            'message' => 'Jika email terdaftar, link ubah password telah dikirim.',
            'data' => [
                'email' => 'active@example.com',
            ],
            'version' => 2,
        ]);

    Notification::assertSentTo($user, ResetPasswordNotification::class);
});

it('rate limits repeated password reset requests for the same user', function () {
    Notification::fake();

    $user = User::factory()->create([
        'email' => 'throttled@example.com',
        'is_active' => true,
    ]);

    Password::sendResetLink(['email' => $user->email]);
    Notification::fake();

    $this->postJson('/api/v2/password/forgot', [
        'email' => 'throttled@example.com',
    ])
        ->assertStatus(429)
        ->assertJson([
            'status' => false,
            'errorCode' => 429,
            'version' => 2,
        ])
        ->assertJsonPath('message', fn (string $message) => str_contains($message, 'reset password'));

    Notification::assertNothingSent();
});

it('validates required fields when resetting password', function () {
    $this->postJson('/api/v2/password/reset', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['token', 'email', 'password']);
});

it('validates password confirmation when resetting password', function () {
    $this->postJson('/api/v2/password/reset', [
        'token' => 'sample-token',
        'email' => 'user@example.com',
        'password' => 'newPassword123',
        'password_confirmation' => 'differentPassword',
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['password']);
});

it('returns a generic error when email is not registered', function () {
    $this->postJson('/api/v2/password/reset', [
        'token' => 'sample-token',
        'email' => 'missing@example.com',
        'password' => 'newPassword123',
        'password_confirmation' => 'newPassword123',
    ])
        ->assertStatus(400)
        ->assertJson([
            'status' => false,
            'errorCode' => 400,
            'message' => 'Token reset tidak valid atau sudah kadaluarsa.',
            'version' => 2,
        ]);
});

it('returns a generic error when user is inactive', function () {
    $user = User::factory()->create([
        'email' => 'inactive@example.com',
        'is_active' => false,
    ]);

    $token = Password::createToken($user);

    $this->postJson('/api/v2/password/reset', [
        'token' => $token,
        'email' => 'inactive@example.com',
        'password' => 'newPassword123',
        'password_confirmation' => 'newPassword123',
    ])
        ->assertStatus(400)
        ->assertJson([
            'status' => false,
            'errorCode' => 400,
            'message' => 'Token reset tidak valid atau sudah kadaluarsa.',
            'version' => 2,
        ]);

    expect(Hash::check('newPassword123', $user->fresh()->password))->toBeFalse();
});

it('returns a generic error when reset token is invalid', function () {
    User::factory()->create([
        'email' => 'active@example.com',
        'is_active' => true,
    ]);

    $this->postJson('/api/v2/password/reset', [
        'token' => 'invalid-token',
        'email' => 'active@example.com',
        'password' => 'newPassword123',
        'password_confirmation' => 'newPassword123',
    ])
        ->assertStatus(400)
        ->assertJson([
            'status' => false,
            'errorCode' => 400,
            'message' => 'Token reset tidak valid atau sudah kadaluarsa.',
            'version' => 2,
        ]);
});

it('resets password for an active user with a valid token', function () {
    $user = User::factory()->create([
        'email' => 'active@example.com',
        'is_active' => true,
        'firebase_uid' => 'firebase-reset-uid',
    ]);

    $token = Password::createToken($user);

    mockFirebasePasswordSyncForReset();

    $this->postJson('/api/v2/password/reset', [
        'token' => $token,
        'email' => 'active@example.com',
        'password' => 'newPassword123',
        'password_confirmation' => 'newPassword123',
    ])
        ->assertSuccessful()
        ->assertJson([
            'status' => true,
            'message' => 'Password berhasil diubah.',
            'data' => [
                'email' => 'active@example.com',
            ],
            'version' => 2,
        ]);

    expect(Hash::check('newPassword123', $user->fresh()->password))->toBeTrue();
});

it('invalidates reset token after successful password reset', function () {
    $user = User::factory()->create([
        'email' => 'reuse@example.com',
        'is_active' => true,
    ]);

    $token = Password::createToken($user);

    $this->postJson('/api/v2/password/reset', [
        'token' => $token,
        'email' => 'reuse@example.com',
        'password' => 'newPassword123',
        'password_confirmation' => 'newPassword123',
    ])->assertSuccessful();

    $this->postJson('/api/v2/password/reset', [
        'token' => $token,
        'email' => 'reuse@example.com',
        'password' => 'anotherPassword1',
        'password_confirmation' => 'anotherPassword1',
    ])
        ->assertStatus(400)
        ->assertJson([
            'status' => false,
            'errorCode' => 400,
            'message' => 'Token reset tidak valid atau sudah kadaluarsa.',
            'version' => 2,
        ]);
});

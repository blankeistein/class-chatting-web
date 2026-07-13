<?php

use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;

uses(RefreshDatabase::class);

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

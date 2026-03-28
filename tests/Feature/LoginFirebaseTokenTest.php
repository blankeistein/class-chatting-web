<?php

use App\Models\User;
use App\Services\FirebaseCustomTokenService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery\MockInterface;

uses(RefreshDatabase::class);

it('returns firebase auth data in the session after a user logs in', function () {
    $user = User::factory()->create([
        'email' => 'user@example.com',
        'password' => bcrypt('secret123'),
        'role' => 'user',
    ]);

    $this->mock(FirebaseCustomTokenService::class, function (MockInterface $mock) use ($user): void {
        $mock->shouldReceive('issueFor')
            ->once()
            ->withArgs(fn (User $loggedInUser): bool => $loggedInUser->is($user))
            ->andReturn([
                'uid' => 'web-user-'.$user->id,
                'custom_token' => 'firebase-custom-token-user',
            ]);
    });

    $response = $this->post('/login', [
        'email' => 'user@example.com',
        'password' => 'secret123',
    ]);

    $response
        ->assertRedirect(route('home'))
        ->assertSessionHas('firebase_auth', [
            'uid' => 'web-user-'.$user->id,
            'custom_token' => 'firebase-custom-token-user',
        ]);

    $this->assertAuthenticatedAs($user);
});

it('returns firebase auth data in the session after an admin logs in', function () {
    $admin = User::factory()->create([
        'email' => 'admin@example.com',
        'password' => bcrypt('secret123'),
        'role' => 'admin',
    ]);

    $this->mock(FirebaseCustomTokenService::class, function (MockInterface $mock) use ($admin): void {
        $mock->shouldReceive('issueFor')
            ->once()
            ->withArgs(fn (User $loggedInUser): bool => $loggedInUser->is($admin))
            ->andReturn([
                'uid' => 'web-user-'.$admin->id,
                'custom_token' => 'firebase-custom-token-admin',
            ]);
    });

    $response = $this->post('/login', [
        'email' => 'admin@example.com',
        'password' => 'secret123',
    ]);

    $response
        ->assertRedirect(route('admin.dashboard'))
        ->assertSessionHas('firebase_auth', [
            'uid' => 'web-user-'.$admin->id,
            'custom_token' => 'firebase-custom-token-admin',
        ]);

    $this->assertAuthenticatedAs($admin);
});

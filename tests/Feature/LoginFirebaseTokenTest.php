<?php

use App\Models\User;
use App\Services\FirebaseCustomTokenService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Kreait\Firebase\JWT\Contract\Token as ContractToken;
use Kreait\Laravel\Firebase\Facades\Firebase;
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

it('rejects password login for an inactive user', function () {
    User::factory()->create([
        'email' => 'inactive@example.com',
        'password' => bcrypt('secret123'),
        'is_active' => false,
    ]);

    $this->mock(FirebaseCustomTokenService::class, function (MockInterface $mock): void {
        $mock->shouldNotReceive('issueFor');
    });

    $response = $this->post('/login', [
        'email' => 'inactive@example.com',
        'password' => 'secret123',
    ]);

    $response
        ->assertSessionHasErrors([
            'email' => 'Autentikasi gagal',
        ]);

    $this->assertGuest();
});

it('rejects google login for an inactive user', function () {
    User::factory()->create([
        'email' => 'inactive-google@example.com',
        'firebase_uid' => 'existing-firebase-uid',
        'is_active' => false,
    ]);

    $claims = Mockery::mock();
    $claims->shouldReceive('get')->with('sub')->andReturn('new-firebase-uid');
    $claims->shouldReceive('get')->with('email')->andReturn('inactive-google@example.com');
    $claims->shouldReceive('get')->with('name')->andReturn('Inactive User');
    $claims->shouldReceive('get')->with('picture')->andReturn(null);
    $claims->shouldReceive('get')->with('email_verified')->andReturn(true);

    $verifiedToken = Mockery::mock(ContractToken::class);
    $verifiedToken->shouldReceive('claims')->times(5)->andReturn($claims);

    $auth = Mockery::mock();
    $auth->shouldReceive('verifyIdToken')
        ->once()
        ->with('valid-google-token')
        ->andReturn($verifiedToken);

    Firebase::shouldReceive('auth')->once()->andReturn($auth);

    $this->mock(FirebaseCustomTokenService::class, function (MockInterface $mock): void {
        $mock->shouldNotReceive('issueFor');
    });

    $response = $this->postJson('/auth/firebase/google', [
        'id_token' => 'valid-google-token',
    ]);

    $response
        ->assertUnauthorized()
        ->assertJsonPath('message', 'Autentikasi gagal. Silakan coba lagi.');

    $this->assertGuest();

    $this->assertDatabaseHas('users', [
        'email' => 'inactive-google@example.com',
        'firebase_uid' => 'existing-firebase-uid',
        'is_active' => false,
    ]);
});

<?php

use App\Models\User;
use App\Services\EmailConfigService;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(LazilyRefreshDatabase::class);

beforeEach(function () {
    config()->set('database.default', 'mysql');
    config()->set('database.connections.mysql.database', 'app_lestariilmu_id');
    DB::purge('mysql');
});

/*
|--------------------------------------------------------------------------
| Feature Tests for EmailConfigController
| Validates: Requirements 4.1, 4.3, 4.4, 2.2, 2.3
|--------------------------------------------------------------------------
*/

test('admin can access email-config page and receives correct Inertia component with props', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $response = $this
        ->actingAs($admin)
        ->get(route('admin.email-config.index'));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('Admin/Settings/Index')
        ->has('emailConfig')
        ->has('emailConfig.mailer')
        ->has('emailConfig.config')
        ->has('emailConfig.from')
    );
});

test('non-admin user is redirected away from email-config page', function () {
    $user = User::factory()->create([
        'role' => 'user',
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('admin.email-config.index'));

    $response->assertRedirect(route('home'));
});

test('unauthenticated user is redirected to login', function () {
    $response = $this->get(route('admin.email-config.index'));

    $response->assertRedirect(route('login'));
});

test('check-connection endpoint returns expected JSON structure', function () {
    $this->mock(EmailConfigService::class, function ($mock) {
        $mock->shouldReceive('getActiveConfig')->andReturn([
            'mailer' => 'smtp',
            'config' => [],
            'from' => ['address' => null, 'name' => null],
        ]);
        $mock->shouldReceive('checkSmtpConnection')->andReturn([
            'status' => 'connected',
            'banner' => '220 smtp.example.com ESMTP',
            'error' => null,
            'error_type' => null,
            'response_time_ms' => 150,
        ]);
    });

    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $response = $this
        ->actingAs($admin)
        ->postJson(route('admin.email-config.check-connection'));

    $response->assertStatus(200);
    $response->assertJsonStructure([
        'status',
        'banner',
        'error',
        'error_type',
        'response_time_ms',
    ]);
    $response->assertJson([
        'status' => 'connected',
        'banner' => '220 smtp.example.com ESMTP',
        'response_time_ms' => 150,
    ]);
});

test('send-test endpoint with valid email returns success JSON', function () {
    $this->mock(EmailConfigService::class, function ($mock) {
        $mock->shouldReceive('getActiveConfig')->andReturn([
            'mailer' => 'smtp',
            'config' => [],
            'from' => ['address' => null, 'name' => null],
        ]);
        $mock->shouldReceive('sendTestEmail')
            ->with('test@example.com')
            ->andReturn([
                'success' => true,
                'message' => 'Test email sent successfully',
                'sent_at' => '15 Jan 2025 10:30:00',
                'error_type' => null,
            ]);
    });

    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $response = $this
        ->actingAs($admin)
        ->postJson(route('admin.email-config.send-test'), [
            'email' => 'test@example.com',
        ]);

    $response->assertStatus(200);
    $response->assertJsonStructure([
        'success',
        'message',
        'sent_at',
        'error_type',
    ]);
    $response->assertJson([
        'success' => true,
        'message' => 'Test email sent successfully',
    ]);
});

test('send-test endpoint rejects invalid email with 422', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $response = $this
        ->actingAs($admin)
        ->postJson(route('admin.email-config.send-test'), [
            'email' => 'not-a-valid-email',
        ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors('email');
});

test('send-test endpoint rejects empty email with 422', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $response = $this
        ->actingAs($admin)
        ->postJson(route('admin.email-config.send-test'), [
            'email' => '',
        ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors('email');
});

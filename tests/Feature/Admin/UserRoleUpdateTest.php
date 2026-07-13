<?php

use App\Enums\RoleEnum;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;

uses(RefreshDatabase::class);

it('allows admin to authorize user update through the policy', function () {
    $admin = User::factory()->create(['role' => RoleEnum::Admin]);
    $target = User::factory()->create(['role' => RoleEnum::User]);

    expect(Gate::forUser($admin)->allows('update', $target))->toBeTrue();
    expect(Gate::forUser($admin)->allows('changeRole', [$target, RoleEnum::Teacher->value]))->toBeTrue();
});

it('allows staff to authorize user update but not promote to admin', function () {
    $staff = User::factory()->create(['role' => RoleEnum::Staff]);
    $target = User::factory()->create(['role' => RoleEnum::User]);

    expect(Gate::forUser($staff)->allows('update', $target))->toBeTrue();
    expect(Gate::forUser($staff)->allows('changeRole', [$target, RoleEnum::Teacher->value]))->toBeTrue();
    expect(Gate::forUser($staff)->allows('changeRole', [$target, RoleEnum::Admin->value]))->toBeFalse();
});

it('allows admin to change a user role', function () {
    $admin = User::factory()->create(['role' => RoleEnum::Admin]);
    $target = User::factory()->create([
        'name' => 'Budi',
        'email' => 'budi@example.com',
        'role' => RoleEnum::User,
        'firebase_uid' => null,
    ]);

    $this
        ->actingAs($admin)
        ->put(route('admin.users.update', $target), [
            'name' => 'Budi',
            'email' => 'budi@example.com',
            'username' => null,
            'phone' => null,
            'role' => RoleEnum::Teacher->value,
            'is_active' => true,
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($target->fresh()->role)->toBe(RoleEnum::Teacher);
});

it('blocks non-admin users from the admin user update route', function () {
    $regularUser = User::factory()->create(['role' => RoleEnum::User]);
    $target = User::factory()->create(['role' => RoleEnum::Student]);

    $this
        ->actingAs($regularUser)
        ->put(route('admin.users.update', $target), [
            'name' => 'Target',
            'email' => $target->email,
            'role' => RoleEnum::Teacher->value,
            'is_active' => true,
        ])
        ->assertRedirect(route('home'));
});

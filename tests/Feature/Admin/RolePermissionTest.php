<?php

use App\Enums\RoleEnum;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

test('admin can view roles index page', function () {
    $admin = User::factory()->create([
        'role' => RoleEnum::Admin,
    ]);
    $admin->assignRole('Admin');

    $response = $this->actingAs($admin)->get(route('admin.roles.index'));

    $response->assertOk();
});

test('admin can create a new role with permissions', function () {
    $admin = User::factory()->create([
        'role' => RoleEnum::Admin,
    ]);
    $admin->assignRole('Admin');

    $response = $this->actingAs($admin)->post(route('admin.roles.store'), [
        'name' => 'Koordinator Buku',
        'permissions' => ['books.view', 'books.create'],
    ]);

    $response->assertRedirect(route('admin.roles.index'));
    $this->assertDatabaseHas('roles', [
        'name' => 'Koordinator Buku',
    ]);

    $role = Role::findByName('Koordinator Buku');
    expect($role->hasPermissionTo('books.view'))->toBeTrue()
        ->and($role->hasPermissionTo('books.create'))->toBeTrue()
        ->and($role->hasPermissionTo('users.create'))->toBeFalse();
});

test('admin can update a role and its permissions', function () {
    $admin = User::factory()->create([
        'role' => RoleEnum::Admin,
    ]);
    $admin->assignRole('Admin');

    $role = Role::create(['name' => 'Editor Khusus', 'guard_name' => 'web']);
    $role->givePermissionTo('books.view');

    $response = $this->actingAs($admin)->put(route('admin.roles.update', $role->id), [
        'name' => 'Editor Khusus Update',
        'permissions' => ['books.view', 'books.edit'],
    ]);

    $response->assertRedirect(route('admin.roles.index'));
    $role->refresh();
    expect($role->name)->toBe('Editor Khusus Update')
        ->and($role->hasPermissionTo('books.edit'))->toBeTrue();
});

test('protected roles cannot be deleted', function () {
    $admin = User::factory()->create([
        'role' => RoleEnum::Admin,
    ]);
    $admin->assignRole('Admin');

    $adminRole = Role::findByName('Admin');
    $response = $this->actingAs($admin)->delete(route('admin.roles.destroy', $adminRole->id));

    $response->assertSessionHasErrors();
    $this->assertDatabaseHas('roles', ['name' => 'Admin']);
});

test('custom role can be deleted', function () {
    $admin = User::factory()->create([
        'role' => RoleEnum::Admin,
    ]);
    $admin->assignRole('Admin');

    $role = Role::create(['name' => 'Role Sementara', 'guard_name' => 'web']);
    $response = $this->actingAs($admin)->delete(route('admin.roles.destroy', $role->id));

    $response->assertRedirect(route('admin.roles.index'));
    $this->assertDatabaseMissing('roles', ['name' => 'Role Sementara']);
});

test('regular user cannot access roles index', function () {
    $user = User::factory()->create([
        'role' => RoleEnum::User,
    ]);
    $user->assignRole('User');

    $response = $this->actingAs($user)->get(route('admin.roles.index'));

    $response->assertForbidden();
});

test('admin can create and delete permissions', function () {
    $admin = User::factory()->create([
        'role' => RoleEnum::Admin,
    ]);
    $admin->assignRole('Admin');

    $response = $this->actingAs($admin)->post(route('admin.permissions.store'), [
        'name' => 'custom.report_export',
    ]);

    $response->assertRedirect(route('admin.permissions.index'));
    $this->assertDatabaseHas('permissions', ['name' => 'custom.report_export']);

    $perm = Permission::findByName('custom.report_export', 'web');
    $deleteResponse = $this->actingAs($admin)->delete(route('admin.permissions.destroy', $perm->id));

    $deleteResponse->assertRedirect(route('admin.permissions.index'));
    $this->assertDatabaseMissing('permissions', ['name' => 'custom.report_export']);
});

test('teacher can only view students from their own school', function () {
    $schoolA = School::factory()->create();
    $schoolB = School::factory()->create();

    // Teacher in School A
    $teacherUser = User::factory()->create([
        'role' => RoleEnum::Teacher,
    ]);
    $teacherUser->assignRole('Teacher');
    $teacher = Teacher::create([
        'user_id' => $teacherUser->id,
        'school_id' => $schoolA->id,
        'is_active' => true,
    ]);

    // Student in School A
    $studentUserA = User::factory()->create(['role' => RoleEnum::Student]);
    $studentA = Student::create([
        'user_id' => $studentUserA->id,
        'school_id' => $schoolA->id,
        'is_active' => true,
    ]);

    // Student in School B
    $studentUserB = User::factory()->create(['role' => RoleEnum::Student]);
    $studentB = Student::create([
        'user_id' => $studentUserB->id,
        'school_id' => $schoolB->id,
        'is_active' => true,
    ]);

    expect($teacherUser->can('view', $studentA))->toBeTrue()
        ->and($teacherUser->can('view', $studentB))->toBeFalse();
});

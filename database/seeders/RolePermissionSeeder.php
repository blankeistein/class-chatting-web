<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            // Users
            'users.view', 'users.create', 'users.edit', 'users.delete',

            // Books
            'books.view', 'books.create', 'books.edit', 'books.delete', 'books.upload',

            // Videos
            'videos.view', 'videos.create', 'videos.edit', 'videos.delete', 'videos.upload',

            // Activation Codes
            'activation-codes.view', 'activation-codes.create',
            'activation-codes.edit', 'activation-codes.delete', 'activation-codes.export',

            // Schools
            'schools.view', 'schools.create', 'schools.edit',
            'schools.delete', 'schools.import',

            // Students
            'students.view', 'students.create', 'students.edit', 'students.delete',

            // Teachers
            'teachers.view', 'teachers.create', 'teachers.edit', 'teachers.delete',

            // Regions
            'regions.view', 'regions.create', 'regions.edit', 'regions.delete',

            // Settings & Email Config
            'settings.view', 'settings.edit',
            'email-config.view', 'email-config.edit',

            // Apps Management
            'apps.view', 'apps.edit',

            // Roles & Permissions Management
            'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
            'permissions.view', 'permissions.create', 'permissions.edit', 'permissions.delete',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        // Admin & Developer get all permissions
        $allPermissions = Permission::where('guard_name', 'web')->get();

        $adminRole = Role::findOrCreate('Admin', 'web');
        $adminRole->syncPermissions($allPermissions);

        $developerRole = Role::findOrCreate('Developer', 'web');
        $developerRole->syncPermissions($allPermissions);

        // Staff
        $staffRole = Role::findOrCreate('Staff', 'web');
        $staffRole->syncPermissions([
            'users.view', 'users.create', 'users.edit',
            'books.view', 'books.create', 'books.edit', 'books.upload',
            'videos.view', 'videos.create', 'videos.edit', 'videos.upload',
            'activation-codes.view', 'activation-codes.create', 'activation-codes.export',
            'schools.view',
            'students.view', 'students.create', 'students.edit',
            'teachers.view', 'teachers.create', 'teachers.edit',
            'regions.view',
            'apps.view',
        ]);

        // Teacher
        $teacherRole = Role::findOrCreate('Teacher', 'web');
        $teacherRole->syncPermissions([
            'videos.view', 'videos.create', 'videos.edit',
            'students.view',
            'schools.view',
            'books.view',
        ]);

        // Student & User
        $studentRole = Role::findOrCreate('Student', 'web');
        $studentRole->syncPermissions(['books.view', 'videos.view']);

        $userRole = Role::findOrCreate('User', 'web');
        $userRole->syncPermissions(['books.view', 'videos.view']);

        // Assign Spatie roles to existing users based on their role column
        $roleMapping = [
            'admin' => 'Admin',
            'developer' => 'Developer',
            'staff' => 'Staff',
            'teacher' => 'Teacher',
            'student' => 'Student',
            'user' => 'User',
        ];

        foreach ($roleMapping as $enumValue => $spatieRoleName) {
            User::where('role', $enumValue)
                ->each(function (User $user) use ($spatieRoleName): void {
                    $user->syncRoles([$spatieRoleName]);
                });
        }
    }
}

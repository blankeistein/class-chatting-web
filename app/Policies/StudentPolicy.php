<?php

namespace App\Policies;

use App\Enums\RoleEnum;
use App\Models\Student;
use App\Models\User;

class StudentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('students.view');
    }

    public function view(User $user, Student $student): bool
    {
        if ($user->hasRole(['Admin', 'Developer'])) {
            return true;
        }

        if (! $user->can('students.view')) {
            return false;
        }

        // If user is a teacher, can only view students from their school
        if ($user->role === RoleEnum::Teacher && $user->teacher) {
            return $student->school_id === $user->teacher->school_id;
        }

        // If user is a student, can only view own profile or students from same school
        if ($user->role === RoleEnum::Student && $user->student) {
            return $student->school_id === $user->student->school_id;
        }

        return true;
    }

    public function create(User $user): bool
    {
        return $user->can('students.create');
    }

    public function update(User $user, Student $student): bool
    {
        if ($user->hasRole(['Admin', 'Developer'])) {
            return true;
        }

        if (! $user->can('students.edit')) {
            return false;
        }

        if ($user->role === RoleEnum::Teacher && $user->teacher) {
            return $student->school_id === $user->teacher->school_id;
        }

        return true;
    }

    public function delete(User $user, Student $student): bool
    {
        if ($user->hasRole(['Admin', 'Developer'])) {
            return true;
        }

        if (! $user->can('students.delete')) {
            return false;
        }

        if ($user->role === RoleEnum::Teacher && $user->teacher) {
            return $student->school_id === $user->teacher->school_id;
        }

        return true;
    }

    public function restore(User $user, Student $student): bool
    {
        return $user->can('students.delete');
    }

    public function forceDelete(User $user, Student $student): bool
    {
        return $user->can('students.delete');
    }
}

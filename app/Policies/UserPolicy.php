<?php

namespace App\Policies;

use App\Enums\RoleEnum;
use App\Models\User;

class UserPolicy
{
    public function before(User $user, $ability): ?bool
    {
        if ($user->isAdmin()) {
            return true; // Admin can perform any action
        }

        return null; // Defer to other methods for non-admin users
    }

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->canManageUsers();
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, User $model): bool
    {
        return $user->canManageUsers();
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->canManageUsers();
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, User $model): bool
    {
        return $user->canManageUsers();
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, User $model): bool
    {
        // Cannot delete yourself
        if ($user->id === $model->id) {
            return false;
        }

        return $user->isAdmin();
    }

    /**
     * Determine whether the user can change the role of the model.
     */
    public function changeRole(User $user, User $model, string $newRole): bool
    {
        if ($user->isAdmin()) {
            return in_array($newRole, RoleEnum::values(), true);
        }

        // Staff can only change roles to user, teacher, or student
        if ($user->isStaff()) {
            $allowedRoles = [
                RoleEnum::User->value,
                RoleEnum::Teacher->value,
                RoleEnum::Student->value,
            ];

            return in_array($newRole, $allowedRoles, true);
        }

        return false;
    }
}

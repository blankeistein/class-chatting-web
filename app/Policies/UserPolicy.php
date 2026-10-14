<?php

namespace App\Policies;

use App\Enums\RoleEnum;
use App\Models\User;

class UserPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('users.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, User $model): bool
    {
        return $user->can('users.view');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('users.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, User $model): bool
    {
        return $user->can('users.edit');
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

        return $user->can('users.delete');
    }

    /**
     * Determine whether the user can change the role of the model.
     */
    public function changeRole(User $user, User $model, string $newRole): bool
    {
        if ($user->can('roles.edit') || $user->hasRole(['Admin', 'Developer'])) {
            return in_array($newRole, RoleEnum::values(), true);
        }

        if ($user->can('users.edit')) {
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

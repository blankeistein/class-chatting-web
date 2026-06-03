<?php

namespace App\Policies;

use App\Models\ActivationCode;
use App\Models\User;

class ActivationCodePolicy
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
        return $user->canManageContent();
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, ActivationCode $activationCode): bool
    {
        return $user->canManageContent();
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->canManageContent();
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, ActivationCode $activationCode): bool
    {
        if ($user->isStaff()) {
            return $activationCode->created_by === $user->id;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, ActivationCode $activationCode): bool
    {
        // Staff can only delete activation codes they created
        if ($user->isStaff()) {
            return $activationCode->created_by === $user->id;
        }

        return false;
    }

    public function export(User $user): bool
    {
        return $user->canManageContent();
    }
}

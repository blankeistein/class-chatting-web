<?php

namespace App\Policies;

use App\Models\ActivationCode;
use App\Models\User;

class ActivationCodePolicy
{
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
        return $user->canManageContent();
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, ActivationCode $activationCode): bool
    {
        // Admin can delete any activation code
        if ($user->isAdmin()) {
            return true;
        }

        // Staff can only delete activation codes they created
        if ($user->isStaff()) {
            return $activationCode->created_by === $user->id;
        }

        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, ActivationCode $activationCode): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, ActivationCode $activationCode): bool
    {
        return $user->isAdmin();
    }
}

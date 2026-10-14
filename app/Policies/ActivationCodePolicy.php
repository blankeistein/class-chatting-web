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
        return $user->can('activation-codes.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, ActivationCode $activationCode): bool
    {
        return $user->can('activation-codes.view');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('activation-codes.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, ActivationCode $activationCode): bool
    {
        if ($user->hasRole(['Admin', 'Developer'])) {
            return true;
        }

        if ($user->can('activation-codes.edit')) {
            return $activationCode->created_by === null || $activationCode->created_by === $user->id;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, ActivationCode $activationCode): bool
    {
        if ($user->hasRole(['Admin', 'Developer'])) {
            return true;
        }

        if ($user->can('activation-codes.delete')) {
            return $activationCode->created_by === null || $activationCode->created_by === $user->id;
        }

        return false;
    }

    public function export(User $user): bool
    {
        return $user->can('activation-codes.export');
    }
}

<?php

namespace App\Policies;

use App\Models\User;

class RegionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('regions.view');
    }

    public function view(User $user): bool
    {
        return $user->can('regions.view');
    }

    /**
     * Determine whether the user can create regions.
     */
    public function create(User $user): bool
    {
        return $user->can('regions.create');
    }

    /**
     * Determine whether the user can update regions.
     */
    public function update(User $user): bool
    {
        return $user->can('regions.edit');
    }

    /**
     * Determine whether the user can delete regions.
     */
    public function delete(User $user): bool
    {
        return $user->can('regions.delete');
    }
}

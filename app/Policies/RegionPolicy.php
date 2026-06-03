<?php

namespace App\Policies;

use App\Models\User;

class RegionPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        if ($user->isAdmin()) {
            return true; // Admin can perform any action
        }

        return null; // Defer to other methods for non-admin users
    }

    /**
     * Determine whether the user can create regions.
     */
    public function create(User $user): bool
    {
        return false; // Only admin can create (handled by before method)
    }

    /**
     * Determine whether the user can update regions.
     */
    public function update(User $user): bool
    {
        return false; // Only admin can update (handled by before method)
    }

    /**
     * Determine whether the user can delete regions.
     */
    public function delete(User $user): bool
    {
        return false; // Only admin can delete (handled by before method)
    }
}

<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Video;

class VideoPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('videos.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Video $video): bool
    {
        return $user->can('videos.view');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('videos.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Video $video): bool
    {
        if ($user->hasRole(['Admin', 'Developer'])) {
            return true;
        }

        return $user->can('videos.edit') && $video->uploaded_by === $user->id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Video $video): bool
    {
        if ($user->hasRole(['Admin', 'Developer'])) {
            return true;
        }

        return $user->can('videos.delete') && $video->uploaded_by === $user->id;
    }
}

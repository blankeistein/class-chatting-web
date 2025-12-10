<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Video extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'user_id',
        'thumbnail',
        'video_url',
        'storage_path',
        'provider',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    /**
     * Get the user that owns the video.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

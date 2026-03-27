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
        'uploaded_by',
        'thumbnail',
        'video_url',
        'storage_path',
        'provider',
        'metadata',
        'tags',
    ];

    public function getRouteKeyName()
    {
        return 'slug';
    }

    protected $casts = [
        'metadata' => 'array',
        'tags' => 'array',
    ];

    /**
     * Get the user that uploaded the video.
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}

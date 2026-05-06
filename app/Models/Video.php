<?php

namespace App\Models;

use App\Enums\VideoProviderEnum;
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

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'tags' => 'array',
            'provider' => VideoProviderEnum::class,
        ];
    }

    /**
     * Get the user that uploaded the video.
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VideoView extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'video_id',
        'user_id',
        'ip_address',
        'user_agent',
        'viewed_at',
    ];

    protected function casts(): array
    {
        return [
            'viewed_at' => 'datetime',
        ];
    }

    /**
     * Get the video that was viewed.
     */
    public function video(): BelongsTo
    {
        return $this->belongsTo(Video::class);
    }

    /**
     * Get the user who viewed the video.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope to filter views by date range.
     */
    public function scopeInDateRange(Builder $query, string $startDate, string $endDate): Builder
    {
        return $query->whereBetween('viewed_at', [$startDate, $endDate]);
    }

    /**
     * Scope to filter views by specific video.
     */
    public function scopeForVideo(Builder $query, int $videoId): Builder
    {
        return $query->where('video_id', $videoId);
    }

    /**
     * Scope to filter views by specific user.
     */
    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to get recent views.
     */
    public function scopeRecent(Builder $query, int $days = 7): Builder
    {
        return $query->where('viewed_at', '>=', now()->subDays($days));
    }

    /**
     * Scope to get unique views (one per user per video).
     */
    public function scopeUnique(Builder $query): Builder
    {
        return $query->select('video_id', 'user_id')
            ->distinct();
    }

    /**
     * Get the total view count for a video.
     */
    public static function countForVideo(int $videoId): int
    {
        return static::where('video_id', $videoId)->count();
    }

    /**
     * Get unique viewer count for a video.
     */
    public static function uniqueViewersForVideo(int $videoId): int
    {
        return static::where('video_id', $videoId)
            ->distinct('user_id')
            ->count('user_id');
    }
}

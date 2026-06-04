<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Book extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'uuid',
        'title',
        'type',
        'cover_url',
        'tags',
        'url',
        'version',
    ];

    public const TYPE_MATERI = 'materi';

    public const TYPE_PENILAIAN = 'penilaian';

    protected $casts = [
        'tags' => 'array',
    ];

    public function activationCodes()
    {
        return $this->morphToMany(ActivationCode::class, 'model', 'activation_items')->withTimestamps();
    }

    public function getThumbnailAttribute()
    {
        if (! $this->cover_url) {
            return asset('assets/images/book-thumbnail.webp');
        }

        if (str_starts_with($this->cover_url, 'http://') || str_starts_with($this->cover_url, 'https://')) {
            return $this->cover_url;
        }

        return asset('storage/'.$this->cover_url);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_books')->withTimestamps();
    }

    public function integrations(): HasMany
    {
        return $this->hasMany(BookIntegration::class);
    }

    /**
     * Scope a query to filter books by type.
     */
    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope a query to only include materi books.
     */
    public function scopeMateri($query)
    {
        return $query->where('type', self::TYPE_MATERI);
    }

    /**
     * Scope a query to only include penilaian books.
     */
    public function scopePenilaian($query)
    {
        return $query->where('type', self::TYPE_PENILAIAN);
    }

    /**
     * Scope a query to search books by title or uuid.
     */
    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('title', 'like', "%{$search}%")
                ->orWhere('uuid', 'like', "%{$search}%");
        });
    }

    /**
     * Scope a query to find book by uuid.
     */
    public function scopeByUuid($query, $uuid)
    {
        return $query->where('uuid', $uuid);
    }
}

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

    protected $appends = ['thumbnail'];

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
        return $this->cover_url ? asset('storage/'.$this->cover_url) : asset('assets/images/book-thumbnail.webp');
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_books')->withTimestamps();
    }

    public function integrations(): HasMany
    {
        return $this->hasMany(BookIntegration::class);
    }
}

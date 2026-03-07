<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Book extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'uuid',
        'title',
        'cover_image',
        'tags',
        'url',
        'version',
    ];

    protected $appends = ['thumbnail'];

    protected $casts = [
        'tags' => 'array',
    ];

    public function activationCodes()
    {
        return $this->morphToMany(ActivationCode::class, 'model', 'activation_items')->withTimestamps();
    }

    public function getThumbnailAttribute()
    {
        return $this->cover_image ? asset('storage/'.$this->cover_image) : asset('assets/images/book-thumbnail.webp');
    }
    public function users()
    {
        return $this->belongsToMany(User::class, 'user_books')->withTimestamps();
    }
}

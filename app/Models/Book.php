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
    ];

    public function activationCodes()
    {
        return $this->morphToMany(ActivationCode::class, 'model', 'activation_items')->withTimestamps();
    }
}

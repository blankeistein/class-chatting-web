<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Book extends Model
{
    protected $fillable = [
        'uuid',
        'title',
        'cover_image',
    ];

    public function activationCodes()
    {
        return $this->belongsToMany(ActivationCode::class, 'code_book_map', 'book_id', 'activation_code_id');
    }
}

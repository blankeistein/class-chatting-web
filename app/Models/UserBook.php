<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserBook extends Model
{
    protected $fillable = [
        'user_id',
        'book_id',
        'activation_code_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function book()
    {
        return $this->belongsTo(Book::class);
    }

    public function activationCode()
    {
        return $this->belongsTo(ActivationCode::class);
    }
}

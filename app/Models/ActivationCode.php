<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivationCode extends Model
{
    protected $fillable = [
        'code',
        'user_id',
        'activated_at',
        'activated_in',
        'tier',
        'times_activated',
        'max_activated',
    ];

    protected $casts = [
        'activated_at' => 'datetime',
        'activated_in' => 'datetime',
        'times_activated' => 'integer',
        'max_activated' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function book()
    {
        return $this->belongsTo(Book::class, 'activated_in', 'id');
    }

    public function books()
    {
        return $this->belongsToMany(Book::class, 'code_book_map', 'activation_code_id', 'book_id');
    }
}

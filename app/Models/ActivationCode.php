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

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'uuid');
    }

    public function items()
    {
        return $this->hasMany(ActivationItem::class);
    }
}

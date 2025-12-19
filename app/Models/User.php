<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'firebase_uid',
        'username',
        'email_verified_at',
        'avatar',
        'phone',
        'role',
        'is_status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function getImageAttribute($value)
    {
        return $value ? asset('storage/'.$value) : '/assets/images/avatar-placeholder.webp';
    }

    public function books()
    {
        return $this->belongsToMany(Book::class, 'user_books')->withTimestamps();
    }
}

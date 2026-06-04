<?php

namespace App\Models;

use App\Enums\RoleEnum;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, Notifiable, SoftDeletes;

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
        'is_active',
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
            'role' => RoleEnum::class,
        ];
    }

    public function getImageAttribute($value)
    {
        $avatar = $this->attributes['avatar'] ?? null;

        if (! $avatar) {
            return '/assets/images/avatar-placeholder.webp';
        }

        if (str_starts_with($avatar, 'http')) {
            return $avatar;
        }

        return asset('storage/'.$avatar);
    }

    public function books()
    {
        return $this->belongsToMany(Book::class, 'user_books')->withTimestamps();
    }

    public function metadata()
    {
        return $this->hasMany(UserMetadata::class);
    }

    public function getMeta(string $key, mixed $default = null): mixed
    {
        return $this->metadata->firstWhere('key', $key)?->value ?? $default;
    }

    public function setMeta(string $key, mixed $value): void
    {
        $this->metadata()->updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }

    public function isAdmin(): bool
    {
        return $this->role === RoleEnum::Admin;
    }

    public function isStaff(): bool
    {
        return $this->role === RoleEnum::Staff;
    }

    public function isUser(): bool
    {
        return $this->role === RoleEnum::User;
    }

    public function canManageUsers(): bool
    {
        return $this->role?->canManageUsers() ?? false;
    }

    public function canManageContent(): bool
    {
        return $this->role?->canManageContent() ?? false;
    }

    /**
     * Scope a query to only include active users.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to only include inactive users.
     */
    public function scopeInactive($query)
    {
        return $query->where('is_active', false);
    }

    /**
     * Scope a query to filter users by role.
     */
    public function scopeByRole($query, $role)
    {
        return $query->where('role', $role);
    }

    /**
     * Scope a query to search users by name, email, username, or firebase_uid.
     */
    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('username', 'like', "%{$search}%")
                ->orWhere('firebase_uid', 'like', "%{$search}%");
        });
    }
}

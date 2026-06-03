<?php

namespace App\Enums;

enum RoleEnum: string
{
    case User = 'user';
    case Teacher = 'teacher';
    case Student = 'student';
    case Staff = 'staff';
    case Admin = 'admin';

    public function label(): string
    {
        return match ($this) {
            self::User => 'User',
            self::Teacher => 'Teacher',
            self::Student => 'Student',
            self::Staff => 'Staff',
            self::Admin => 'Admin',
        };
    }

    public function isAdmin(): bool
    {
        return $this === self::Admin;
    }

    public function isStaff(): bool
    {
        return $this === self::Staff;
    }

    public function isUser(): bool
    {
        return $this === self::User;
    }

    public function canManageUsers(): bool
    {
        return in_array($this, [self::Admin, self::Staff], true);
    }

    public function canManageContent(): bool
    {
        return in_array($this, [self::Admin, self::Staff], true);
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}

<?php

namespace App\Enums;

enum ActivationCodeTierEnum: int
{
    case REGULAR = 1;
    case PREMIUM = 2;

    public function label(): string
    {
        return match ($this) {
            self::REGULAR => 'Regular',
            self::PREMIUM => 'Premium',
        };
    }

    public function key(): string
    {
        return match ($this) {
            self::REGULAR => 'regular',
            self::PREMIUM => 'premium',
        };
    }

    public static function labels(): array
    {
        return [
            self::REGULAR->value => 'Regular',
            self::PREMIUM->value => 'Premium',
        ];
    }
}

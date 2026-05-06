<?php

namespace App\Enums;

enum VideoProviderEnum: string
{
    case Local = 'local';
    case Firebase = 'firebase';

    public function label(): string
    {
        return match ($this) {
            self::Local => 'Local',
            self::Firebase => 'Firebase',
        };
    }

    public static function labels(): array
    {
        return [
            self::Local->value => self::Local->label(),
            self::Firebase->value => self::Firebase->label(),
        ];
    }
}

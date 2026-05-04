<?php

namespace App\Enums;

enum AppEnum: string
{
    case CLASS_CHATTING = 'mgt.li.classchatting';
    case ANAK_INDONESIA_MENGHAFAL = 'mgt.li.classchattingmembaca';
    case ULANGAN_ONLINE = 'mgt.li.classchattingexam';
    case CLASS_CHATTING_FOR_KIDS = 'mgt.li.classchattingforkids';
    case CLASS_CHATTING_LAYAR_LEBAR = 'com.lestariilmu.classchattingtv';

    public function label(): string
    {
        return match ($this) {
            self::CLASS_CHATTING => 'Class Chatting',
            self::ANAK_INDONESIA_MENGHAFAL => 'Anak Indonesia Menghafal',
            self::ULANGAN_ONLINE => 'Ulangan Online',
            self::CLASS_CHATTING_FOR_KIDS => 'Class Chatting for Kids',
            self::CLASS_CHATTING_LAYAR_LEBAR => 'Class Chatting Layar Lebar',
        };
    }

    public static function labels(): array
    {
        return [
            self::CLASS_CHATTING->value => 'Class Chatting',
            self::ANAK_INDONESIA_MENGHAFAL->value => 'Anak Indonesia Menghafal',
            self::ULANGAN_ONLINE->value => 'Ulangan Online',
            self::CLASS_CHATTING_FOR_KIDS->value => 'Class Chatting for Kids',
            self::CLASS_CHATTING_LAYAR_LEBAR->value => 'Class Chatting Layar Lebar',
        ];
    }
}

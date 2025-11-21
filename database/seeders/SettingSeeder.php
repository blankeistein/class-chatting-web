<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Setting::create([
            'key' => 'site_name',
            'value' => 'Lestari Ilmu',
        ]);

        Setting::create([
            'key' => 'site_description',
            'value' => 'Website edukasi terbaik di Indonesia',
        ]);

        Setting::create([
            'key' => 'logo',
            'value' => '',
        ]);

        Setting::create([
            'key' => 'favicon',
            'value' => '',
        ]);

        Setting::create([
            'key' => 'google_recaptcha_key',
            'value' => '',
        ]);
    }
}

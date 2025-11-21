<?php

namespace App\Console\Commands;

use App\Models\Setting;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class CacheSettings extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'settings:cache';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Cache all settings from the database.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $settings = Setting::all()->keyBy('key')->map(function ($setting) {
            return $setting->value;
        });

        Cache::forever('settings', $settings);

        $this->info('Settings have been cached successfully!');
    }
}

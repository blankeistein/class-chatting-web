<?php

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

if (!function_exists('setting')) {
    function setting($key, $default = null)
    {
        if (Cache::has('settings')) {
            $settings = Cache::get('settings');
            return $settings->get($key, $default);
        }

        $setting = Setting::where('key', $key)->first();

        if ($setting) {
            return $setting->value;
        }

        return $default;
    }
}

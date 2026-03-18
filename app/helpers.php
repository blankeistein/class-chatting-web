<?php

use App\Models\Setting;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

if (! function_exists('setting')) {
    /**
     * Retrieve an application setting value from cache or database.
     */
    function setting(string $key, mixed $default = null): mixed
    {
        $settings = Cache::get('settings');

        if ($settings instanceof Collection) {
            return $settings->get($key, $default);
        }

        return Setting::query()
            ->where('key', $key)
            ->value('value') ?? $default;
    }
}

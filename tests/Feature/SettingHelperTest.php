<?php

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('it retrieves setting from database', function () {
    Setting::create(['key' => 'test_setting', 'value' => 'test_value']);

    $this->assertEquals('test_value', setting('test_setting'));
});

test('it returns default value for non existent setting', function () {
    $this->assertEquals('default_value', setting('non_existent_setting', 'default_value'));
});

test('it retrieves setting from cache', function () {
    $settings = collect([
        'test_setting_cached' => 'cached_value'
    ]);

    Cache::forever('settings', $settings);

    $this->assertEquals('cached_value', setting('test_setting_cached'));
});

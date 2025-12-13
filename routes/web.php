<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Index');
})->name('home');

$adminPath = Config::get('app.admin_path');

Route::group(['prefix' => $adminPath, 'as' => 'admin.'], function () {
    Route::get('login', [AuthController::class, 'login'])->name('login');

    Route::post('login', [AuthController::class, 'loginAction']);

    Route::get('dashboard', function () {
        return 'Admin Dashboard';
    })->name('dashboard');
});

Route::get('test', function () {
    return Inertia::render('Test');
});

Route::get('test2', function () {
    return Inertia::render('Test2');
});

Route::group(['prefix' => 'learn-reading'], function () {
    Route::get('dashboard', function () {
        return Inertia::render('LearnReading/Dashboard');
    });

    Route::get('preview', function () {
        return Inertia::render('LearnReading/Preview')->rootView('learn-reading');
    });

    Route::get('{id}', function () {
        return Inertia::render('LearnReading/Learn');
    });
});

Route::get('buku-manager', function () {
    return Inertia::render('BukuManager');
});

Route::get('preview-surah', function () {
    return Inertia::render('PreviewSurah');
});

Route::get('folder-explorer', function () {
    return Inertia::render('BookBuilder');
});

<?php

use App\Http\Controllers\Admin\ActivationCodeController;
use App\Http\Controllers\Admin\BookController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Index');
})->name('home');

$adminPath = Config::get('app.admin_path');

Route::get('login', [AuthController::class, 'login'])->name('login')->middleware('guest');
Route::post('login', [AuthController::class, 'loginAction'])->middleware('guest');
Route::delete('logout', [AuthController::class, 'logout'])->name('logout');

Route::middleware('auth')->group(function () {
    Route::get('notifications', [\App\Http\Controllers\NotificationController::class, 'index'])->name('notifications.index');
    Route::put('notifications/{id}/read', [\App\Http\Controllers\NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::put('notifications/read-all', [\App\Http\Controllers\NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');
    Route::delete('notifications/{id}', [\App\Http\Controllers\NotificationController::class, 'destroy'])->name('notifications.destroy');
});

Route::group(['prefix' => $adminPath, 'as' => 'admin.'], function () {

    Route::get('dashboard', function () {
        return Inertia::render('Admin/Index');
    })->name('dashboard');

    Route::get('activation-code/bulk-export', [ActivationCodeController::class, 'bulkExport'])->name('activation-code.bulk-export');
    Route::delete('activation-code/bulk-delete', [ActivationCodeController::class, 'bulkDelete'])->name('activation-code.bulk-delete');
    Route::resource('activation-code', ActivationCodeController::class);

    Route::get('books/selection', [BookController::class, 'selection'])->name('books.selection');
    Route::resource('books', BookController::class);
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

Route::get('penai', function () {
    return Inertia::render('PenAI');
});

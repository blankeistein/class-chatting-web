<?php

use App\Http\Controllers\Admin\ActivationCodeController;
use App\Http\Controllers\Admin\Apps\AnakIndonesiaMenghafal\BookController as AnakIndonesiaMenghafalBookController;
use App\Http\Controllers\Admin\Apps\AnakIndonesiaMenghafal\SettingController as AnakIndonesiaMenghafalSettingController;
use App\Http\Controllers\Admin\Apps\ClassChatting\BookController as ClassChattingBookController;
use App\Http\Controllers\Admin\Apps\ClassChatting\SettingController as ClassChattingSettingController;
use App\Http\Controllers\Admin\BookController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\RegionController as AdminRegionController;
use App\Http\Controllers\Admin\SchoolController as AdminSchoolController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\VideoController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Index');
})->name('home');

Route::get('login', [AuthController::class, 'login'])->name('login')->middleware('guest');
Route::post('login', [AuthController::class, 'loginAction'])->middleware(['guest', 'throttle:login']);
Route::delete('logout', [AuthController::class, 'logout'])->name('logout');

Route::middleware('auth')->group(function () {
    Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::put('notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::put('notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');
    Route::delete('notifications/{id}', [NotificationController::class, 'destroy'])->name('notifications.destroy');

    Route::group(['prefix' => Config::get('app.admin_path'), 'as' => 'admin.', 'middleware' => 'admin'], function () {
        Route::get('/', function () {
            return redirect()->route('admin.dashboard');
        });

        Route::get('/re-auth-firebase', [AuthController::class, 'authenticateFirebaseUser'])->name('authenticate-firebase-user');

        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
        Route::get('videos/jobs', [VideoController::class, 'jobs'])->name('videos.jobs');

        Route::get('activation-code/bulk-export', [ActivationCodeController::class, 'bulkExport'])->name('activation-code.bulk-export');
        Route::delete('activation-code/bulk-delete', [ActivationCodeController::class, 'bulkDelete'])->name('activation-code.bulk-delete');
        Route::patch('activation-code/{id}/toggle-active', [ActivationCodeController::class, 'toggleActive'])->name('activation-code.toggle-active');
        Route::resource('activation-code', ActivationCodeController::class);

        Route::get('books/selection', [BookController::class, 'selection'])->name('books.selection');
        Route::get('books/upload/{id}', [BookController::class, 'upload'])->name('books.upload');
        Route::put('books/upload/{id}', [BookController::class, 'uploadFile'])->name('books.upload.post');
        Route::resource('books', BookController::class);
        Route::get('schools/import', [AdminSchoolController::class, 'importPage'])->name('schools.import-page');
        Route::post('schools/import', [AdminSchoolController::class, 'import'])->name('schools.import');
        Route::get('schools/bulk-export', [AdminSchoolController::class, 'bulkExport'])->name('schools.bulk-export');
        Route::delete('schools/bulk-delete', [AdminSchoolController::class, 'bulkDelete'])->name('schools.bulk-delete');
        Route::resource('schools', AdminSchoolController::class);

        Route::get('regions', [AdminRegionController::class, 'index'])->name('regions.index');
        Route::get('regions/provinces', [AdminRegionController::class, 'provinces'])->name('regions.provinces.index');
        Route::post('regions/provinces', [AdminRegionController::class, 'storeProvince'])->name('regions.provinces.store');
        Route::put('regions/provinces/{province}', [AdminRegionController::class, 'updateProvince'])->name('regions.provinces.update');
        Route::delete('regions/provinces/{province}', [AdminRegionController::class, 'destroyProvince'])->name('regions.provinces.destroy');
        Route::get('regions/regencies', [AdminRegionController::class, 'regencies'])->name('regions.regencies.index');
        Route::post('regions/regencies', [AdminRegionController::class, 'storeRegency'])->name('regions.regencies.store');
        Route::put('regions/regencies/{regency}', [AdminRegionController::class, 'updateRegency'])->name('regions.regencies.update');
        Route::delete('regions/regencies/{regency}', [AdminRegionController::class, 'destroyRegency'])->name('regions.regencies.destroy');
        Route::get('regions/districts', [AdminRegionController::class, 'districts'])->name('regions.districts.index');
        Route::post('regions/districts', [AdminRegionController::class, 'storeDistrict'])->name('regions.districts.store');
        Route::put('regions/districts/{district}', [AdminRegionController::class, 'updateDistrict'])->name('regions.districts.update');
        Route::delete('regions/districts/{district}', [AdminRegionController::class, 'destroyDistrict'])->name('regions.districts.destroy');
        Route::get('regions/villages', [AdminRegionController::class, 'villages'])->name('regions.villages.index');
        Route::post('regions/villages', [AdminRegionController::class, 'storeVillage'])->name('regions.villages.store');
        Route::put('regions/villages/{village}', [AdminRegionController::class, 'updateVillage'])->name('regions.villages.update');
        Route::delete('regions/villages/{village}', [AdminRegionController::class, 'destroyVillage'])->name('regions.villages.destroy');

        Route::resource('videos', VideoController::class);
        Route::delete('users/bulk-delete', [UserController::class, 'bulkDelete'])->name('users.bulk-delete');
        Route::resource('users', UserController::class);

        Route::get('apps', function () {
            return redirect()->route('admin.apps.class-chatting');
        })->name('apps');

        Route::prefix('apps/class-chatting')->group(function () {
            Route::get('/', function () {
                return redirect()->route('admin.apps.class-chatting.book');
            })->name('apps.class-chatting');

            Route::get('book', [ClassChattingBookController::class, 'index'])->name('apps.class-chatting.book');
            Route::post('book/items', [ClassChattingBookController::class, 'store'])->name('apps.class-chatting.book.items.store');
            Route::get('book/items/sync/{uuid}', [ClassChattingBookController::class, 'sync'])->name('apps.class-chatting.book.items.sync');
            Route::put('book/items/{documentId}', [ClassChattingBookController::class, 'update'])->name('apps.class-chatting.book.items.update');
            Route::put('book/items/lock/{documentId}', [ClassChattingBookController::class, 'updateLock'])->name('apps.class-chatting.book.items.lock.update');
            Route::patch('book/items/reorder', [ClassChattingBookController::class, 'reorder'])->name('apps.class-chatting.book.items.reorder');
            Route::delete('book/items/{documentId}', [ClassChattingBookController::class, 'destroy'])->name('apps.class-chatting.book.items.destroy');
            Route::get('book/category', [ClassChattingBookController::class, 'category'])->name('apps.class-chatting.book.category');
            Route::get('book-rtdb', [ClassChattingBookController::class, 'indexRTDB'])->name('apps.class-chatting.book-rtdb');
            Route::get('settings', [ClassChattingSettingController::class, 'index'])->name('apps.class-chatting.settings');
            Route::post('settings', [ClassChattingSettingController::class, 'update'])->name('apps.class-chatting.settings.store');
        });

        Route::prefix('apps/anak-indonesia-menghafal')->group(function () {
            Route::get('/', function () {
                return redirect()->route('admin.apps.anak-indonesia-menghafal.book');
            })->name('apps.anak-indonesia-menghafal');

            Route::get('book', [AnakIndonesiaMenghafalBookController::class, 'index'])->name('apps.anak-indonesia-menghafal.book');
            Route::post('book/items', [AnakIndonesiaMenghafalBookController::class, 'store'])->name('apps.anak-indonesia-menghafal.book.items.store');
            Route::put('book/items/{documentId}', [AnakIndonesiaMenghafalBookController::class, 'update'])->name('apps.anak-indonesia-menghafal.book.items.update');
            Route::put('book/items/lock/{documentId}', [AnakIndonesiaMenghafalBookController::class, 'updateLock'])->name('apps.anak-indonesia-menghafal.book.items.lock.update');
            Route::patch('book/items/reorder', [AnakIndonesiaMenghafalBookController::class, 'reorder'])->name('apps.anak-indonesia-menghafal.book.items.reorder');
            Route::delete('book/items/{documentId}', [AnakIndonesiaMenghafalBookController::class, 'destroy'])->name('apps.anak-indonesia-menghafal.book.items.destroy');
            Route::get('book/category', [AnakIndonesiaMenghafalBookController::class, 'category'])->name('apps.anak-indonesia-menghafal.book.category');
            Route::get('book-rtdb', [AnakIndonesiaMenghafalBookController::class, 'indexRTDB'])->name('apps.anak-indonesia-menghafal.book-rtdb');
            Route::get('settings', [AnakIndonesiaMenghafalSettingController::class, 'index'])->name('apps.anak-indonesia-menghafal.settings');
            Route::post('settings', [AnakIndonesiaMenghafalSettingController::class, 'update'])->name('apps.anak-indonesia-menghafal.settings.store');
        });

    });
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

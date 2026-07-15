<?php

use App\Http\Controllers\API\FirebaseWebhookController;
use App\Http\Controllers\API\RegionController;
use App\Http\Controllers\API\SchoolController;
use App\Http\Controllers\API\V1\BookController as V1BookController;
use App\Http\Controllers\API\V2\BookController as V2BookController;
use App\Http\Controllers\API\V2\EmailVerificationController as V2EmailVerificationController;
use App\Http\Controllers\API\V2\PasswordResetController as V2PasswordResetController;
use App\Http\Controllers\API\V2\ProfileController as V2ProfileController;
use App\Http\Controllers\API\V2\VideoController as V2VideoController;
use App\Http\Controllers\API\VideoController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('v1')->group(function () {
    Route::post('/book/activate', [V1BookController::class, 'activate'])->middleware('throttle:60,1');
    Route::get('/book/level', [V1BookController::class, 'activationCheckLevel']);
    Route::get('/book/level/{code}', [V1BookController::class, 'activationCheckLevel']);
    Route::get('/books', [V1BookController::class, 'index']);
});

Route::prefix('v2')->group(function () {
    Route::post('book/activate', [V2BookController::class, 'activate'])->middleware(['throttle:60,1', 'firebase.id_token']);
    Route::get('book/level/{code}', [V2BookController::class, 'activationCheckLevel'])->middleware(['throttle:500,1', 'firebase.id_token']);

    Route::post('video/{video}', [V2VideoController::class, 'store'])->middleware(['throttle:500,1', 'firebase.id_token']);

    Route::middleware('throttle:10,1')->group(function () {
        Route::post('password/forgot', [V2PasswordResetController::class, 'sendResetLink']);
        Route::post('password/reset', [V2PasswordResetController::class, 'resetPassword']);
    });

    Route::middleware(['throttle:60,1', 'firebase.id_token'])->group(function () {
        Route::get('profile', [V2ProfileController::class, 'show']);
        Route::match(['put', 'post'], 'profile', [V2ProfileController::class, 'update']);

        Route::post('email/verification-notification', [V2EmailVerificationController::class, 'send']);
    });
});

Route::prefix('v1/regions')->middleware('throttle:120,1')->group(function () {
    Route::get('/provinces', [RegionController::class, 'provinces']);
    Route::get('/provinces/{province:code}', [RegionController::class, 'province']);
    Route::get('/provinces/{province:code}/regencies', [RegionController::class, 'regenciesByProvince']);

    Route::get('/regencies', [RegionController::class, 'regencies']);
    Route::get('/regencies/{regency:code}', [RegionController::class, 'regency']);
    Route::get('/regencies/{regency:code}/districts', [RegionController::class, 'districtsByRegency']);

    Route::get('/districts', [RegionController::class, 'districts']);
    Route::get('/districts/{district:code}', [RegionController::class, 'district']);
    Route::get('/districts/{district:code}/villages', [RegionController::class, 'villagesByDistrict']);

    Route::get('/villages', [RegionController::class, 'villages']);
    Route::get('/villages/{village:code}', [RegionController::class, 'village']);
});

Route::prefix('v1/schools')->middleware('throttle:120,1')->group(function () {
    Route::get('/', [SchoolController::class, 'index']);
    Route::get('/{school}', [SchoolController::class, 'show']);
});

Route::middleware(['throttle:1000,1', 'firebase.webhook_secret'])->group(function () {
    Route::post('/video/update-hls-url', [VideoController::class, 'updateHlsUrl']);
});

// Firebase Webhook
Route::middleware(['throttle:1000,1', 'firebase.webhook_secret'])->prefix('firebase')->group(function () {
    Route::post('/webhook/user-created', [FirebaseWebhookController::class, 'userCreated']);
});

<?php

use App\Http\Controllers\API\FirebaseWebhookController;
use App\Http\Controllers\API\RegionController;
use App\Http\Controllers\API\SchoolController;
use App\Http\Controllers\API\V1\BookController as V1BookController;
use App\Http\Controllers\API\V2\BookController as V2BookController;
use App\Http\Controllers\API\VideoController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('v1')->group(function () {
    Route::post('/book/activate', [V1BookController::class, 'activate'])->middleware('throttle:60,1');
    Route::get('/book/level/{code}', [V1BookController::class, 'activationCheckLevel']);
    Route::get('/books', [V1BookController::class, 'index']);
});

Route::prefix('v2')->group(function () {
    Route::post('/book/activate', [V2BookController::class, 'activate'])->middleware(['throttle:60,1', 'firebase.id_token']);
});

Route::prefix('v1/regions')->group(function () {
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

Route::prefix('v1/schools')->group(function () {
    Route::get('/', [SchoolController::class, 'index']);
    Route::get('/{school}', [SchoolController::class, 'show']);
});

Route::middleware(['throttle:1000,1', 'private.api'])->group(function () {
    Route::post('/video/update-hls-url', [VideoController::class, 'updateHlsUrl']);
});

// Firebase Webhook
Route::middleware(['throttle:1000,1', 'firebase.webhook'])->prefix('firebase')->group(function () {
    Route::post('/webhook/user-created', [FirebaseWebhookController::class, 'userCreated']);
});

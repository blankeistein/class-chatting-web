<?php

use App\Http\Controllers\API\BookController;
use App\Http\Controllers\API\VideoController;
use App\Http\Controllers\API\FirebaseWebhookController;
use App\Http\Controllers\API\RegionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('private-api/{api_key}')->middleware('private.api')->group(function () {
    Route::get('/book', [BookController::class, 'index']);
    Route::get('/book/group', [BookController::class, 'group_book']);

    Route::get('/video/list', [VideoController::class, 'index']);
    Route::get('/video/detail/{video_id}', [VideoController::class, 'show']);
    Route::post('/video/add', [VideoController::class, 'create']);
    Route::put('/video/update/{video_id}', [VideoController::class, 'update']);
    Route::delete('/video/delete/{video_id}', [VideoController::class, 'destroy']);
});

Route::post('/v1/book/activate', [BookController::class, 'activate']);
Route::get('/v1/book/level/{code}', [BookController::class, 'activation_check_level']);

Route::prefix('v1/regions')->group(function () {
    Route::get('/provinces', [RegionController::class, 'provinces']);
    Route::get('/provinces/{province:code}', [RegionController::class, 'province']);
    Route::get('/provinces/{province:code}/regencies', [RegionController::class, 'regenciesByProvince']);

    Route::get('/regencies', [RegionController::class, 'regencies']);
    Route::get('/regencies/{regency:code}', [RegionController::class, 'regency']);
    Route::get('/regencies/{regency:code}/districts', [RegionController::class, 'districtsByRegency']);

    Route::get('/districts', [RegionController::class, 'districts']);
    Route::get('/districts/{district:code}', [RegionController::class, 'district']);
});

// Firebase Webhook
Route::middleware('firebase.webhook')->prefix('firebase')->group(function () {
    Route::post('/webhook/user-created', [FirebaseWebhookController::class, 'userCreated']);
});

<?php

use App\Http\Controllers\API\BookController;
use App\Http\Controllers\API\FirebaseWebhookController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/book', [BookController::class, 'index']);
Route::post('/v1/book/activate', [BookController::class, 'activate']);
Route::get('/v1/book/level/{code}', [BookController::class, 'activation_check_level']);

// Firebase Webhook
Route::middleware('firebase.webhook')->prefix('firebase')->group(function () {
    Route::post('/webhook/user-created', [FirebaseWebhookController::class, 'userCreated']);
});

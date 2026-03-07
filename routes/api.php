<?php

use App\Http\Controllers\API\BookController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/book', [BookController::class, 'index']);
Route::post('/v1/book/activate', [BookController::class, 'activate']);
Route::get('/v1/book/level/{code}', [BookController::class, 'activation_check_level']);

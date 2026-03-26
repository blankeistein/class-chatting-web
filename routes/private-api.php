<?php

use App\Http\Controllers\PrivateAPI\BookController;
use App\Http\Controllers\PrivateAPI\VideoController;
use Illuminate\Support\Facades\Route;

Route::prefix('{api_key}')->middleware('private.api')->group(function () {
    Route::get('/book', [BookController::class, 'index']);
    Route::get('/book/group', [BookController::class, 'group_book']);

    Route::get('/video/list', [VideoController::class, 'index']);
    Route::get('/video/detail/{video_id}', [VideoController::class, 'show']);
    Route::post('/video/add', [VideoController::class, 'create']);
    Route::put('/video/update/{video_id}', [VideoController::class, 'update']);
    Route::delete('/video/delete/{video_id}', [VideoController::class, 'destroy']);
});

<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Index');
});

Route::get('login', function () {
    return Inertia::render('Auth/Login');
});

Route::get('test', function () {
    return Inertia::render('Test');
});

Route::get('test2', function () {
    return Inertia::render('Test2');
});

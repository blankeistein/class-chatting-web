<?php

namespace App\Http\Controllers\Admin\Apps\ClassChatting;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class BookController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Apps/ClassChatting/Book/Index');
    }

    public function indexRTDB()
    {
        return Inertia::render('Admin/Apps/ClassChatting/Book/IndexRTDB');
    }

    public function category()
    {
        return Inertia::render('Admin/Apps/ClassChatting/Book/Category');
    }
}

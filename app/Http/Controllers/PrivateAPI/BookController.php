<?php

namespace App\Http\Controllers\PrivateAPI;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Book;

class BookController extends Controller
{
    public function index()
    {
        $books = Book::query()->get();
        $books = $books->map(function ($book) {
            return [
                'id' => $book->uuid,
                'title' => $book->title
            ];
        });

        return response()->json($books);
    }

    public function group_book()
    {
        return response()->json([]);
    }
}

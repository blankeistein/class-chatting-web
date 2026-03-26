<?php

namespace App\Http\Controllers\PrivateAPI;

use App\Http\Controllers\Controller;
use App\Models\Book;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\PathParameter;
use Illuminate\Http\JsonResponse;

#[Group('Private Books', 'Endpoint private untuk integrasi buku internal dengan autentikasi `api_key` pada path URL.', 40)]
class BookController extends Controller
{
    #[Endpoint(
        operationId: 'privateBooksList',
        title: 'List private books',
        description: 'Mengambil daftar buku ringkas untuk consumer internal atau integrasi private API.'
    )]
    #[PathParameter('api_key', 'Private API key yang wajib dikirim pada path URL.', example: 'test-private-key')]
    public function index(): JsonResponse
    {
        $books = Book::query()->get();
        $books = $books->map(function ($book) {
            return [
                'id' => $book->uuid,
                'title' => $book->title,
            ];
        });

        return response()->json($books);
    }

    #[Endpoint(
        operationId: 'privateBooksGroup',
        title: 'List grouped private books',
        description: 'Endpoint placeholder untuk grouping buku private. Saat ini implementasi mengembalikan array kosong.'
    )]
    #[PathParameter('api_key', 'Private API key yang wajib dikirim pada path URL.', example: 'test-private-key')]
    public function group_book(): JsonResponse
    {
        return response()->json([]);
    }
}

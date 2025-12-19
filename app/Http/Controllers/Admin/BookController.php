<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\BookResource;
use App\Models\Book;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BookController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 25);
        $search = $request->input('search');
        $sortBy = $request->input('sort_by', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');

        $books = Book::query()
            ->when($search, function ($query, $search) {
                $query->where('title', 'like', "%{$search}%");
            })
            ->when(in_array($sortBy, ['title', 'created_at', 'updated_at']), function ($query) use ($sortBy, $sortDirection) {
                $query->orderBy($sortBy, $sortDirection === 'asc' ? 'asc' : 'desc');
            }, function ($query) {
                $query->latest();
            })
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Admin/Buku/Index', [
            'books' => BookResource::collection($books),
            'filters' => $request->only(['search', 'per_page', 'sort_by', 'sort_direction']),
        ]);
    }

    public function selection(Request $request)
    {
        $search = $request->input('search');
        
        $books = Book::query()
            ->when($search, function($query, $search) {
                $query->where('title', 'like', "%{$search}%");
            })
            ->latest()
            ->limit(20) // Batasi biar gak berat, ntar pake search aja
            ->get(['id', 'title']);

        return response()->json($books);
    }

    public function destroy($id)
    {
        $book = Book::findOrFail($id);
        $book->delete();

        return redirect()->back()->with('success', 'Buku berhasil dihapus.');
    }
}

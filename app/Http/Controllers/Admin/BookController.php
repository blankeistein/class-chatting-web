<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\BookResource;
use App\Models\Book;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
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

    public function create()
    {
        return Inertia::render('Admin/Buku/Create');
    }

    public function show($id)
    {
        $book = Book::findOrFail($id);

        return Inertia::render('Admin/Buku/Show', [
            'book' => new BookResource($book),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'uuid' => 'nullable|string|max:255|unique:books,uuid',
            'cover_url' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
            'tags' => 'nullable|array',
            'url' => 'nullable|url',
            'version' => 'nullable|integer',
        ]);

        $data = $request->only(['title', 'uuid', 'tags', 'url', 'version']);
        $data['uuid'] = filled($data['uuid'] ?? null) ? $data['uuid'] : (string) Str::uuid();

        if ($request->hasFile('cover_url')) {
            $path = $request->file('cover_url')->store('books', 'public');
            $data['cover_url'] = $path;
        }

        Book::create($data);

        return redirect()->route('admin.books.index')->with('success', 'Buku berhasil ditambahkan.');
    }

    public function edit($id)
    {
        $book = Book::findOrFail($id);

        return Inertia::render('Admin/Buku/Edit', [
            'book' => new BookResource($book),
        ]);
    }

    public function update(Request $request, $id)
    {
        $book = Book::findOrFail($id);

        $request->validate([
            'title' => 'required|string|max:255',
            'cover_url' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
            'tags' => 'nullable|array',
            'url' => 'nullable|url',
            'version' => 'nullable|integer',
        ]);

        $data = $request->only(['title', 'tags', 'url', 'version']);

        if ($request->hasFile('cover_url')) {
            // Delete old image if exists
            if ($book->cover_url) {
                Storage::disk('public')->delete($book->cover_url);
            }
            $path = $request->file('cover_url')->store('books', 'public');
            $data['cover_url'] = $path;
        }

        $book->update($data);

        return redirect()->route('admin.books.index')->with('success', 'Buku berhasil diperbarui.');
    }

    public function selection(Request $request)
    {
        $search = $request->input('search');

        $books = Book::query()
            ->when($search, function ($query, $search) {
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

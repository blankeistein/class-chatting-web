<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\BookStoreRequest;
use App\Http\Requests\BookUpdateRequest;
use App\Http\Requests\BookUploadFileRequest;
use App\Http\Resources\BookResource;
use App\Models\Book;
use App\Services\FirebaseStorageService;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;

class BookController extends Controller
{
    public function __construct(
        private FirebaseStorageService $storage,
    ) {}

    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 25);
        $search = $request->input('search');
        $sortBy = $request->input('sort_by', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');

        $books = Book::query()
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhere('uuid', 'like', "%{$search}%");
                });
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
        if (! Gate::allows('create', Book::class)) {
            return back()->withErrors([
                'authorization' => 'Kamu tidak punya hak untuk menggunakan fitur ini.',
            ]);
        }

        return Inertia::render('Admin/Buku/Create');
    }

    public function show(string $id)
    {
        $book = Book::query()
            ->with('integrations')
            ->findOrFail($id);

        return Inertia::render('Admin/Buku/Show', [
            'book' => new BookResource($book),
        ]);
    }

    public function store(BookStoreRequest $request)
    {
        if (! Gate::allows('create', Book::class)) {
            return back()->withErrors([
                'authorization' => 'Kamu tidak punya hak untuk menggunakan fitur ini.',
            ]);
        }

        $data = $request->safe()->only(['title', 'uuid', 'type', 'tags', 'url', 'version']);
        $data['uuid'] = filled($data['uuid'] ?? null) ? $data['uuid'] : (string) Str::uuid();

        if ($request->hasFile('cover_url')) {
            $coverPath = $this->makeBookThumbnailPath($data['uuid']);

            $this->storage->uploadImageAsWebp($request->file('cover_url'), $coverPath);
            $data['cover_url'] = $this->storage->buildUrl($coverPath);
        }

        if ($request->hasFile('book_file')) {
            $bookFile = $request->file('book_file');
            $storagePath = $this->makeBookFilePath($bookFile, $data['uuid']);

            $this->storage->upload($bookFile, $storagePath);
            $data['url'] = $this->storage->buildUrl($storagePath);
        }

        Book::create($data);

        return redirect()->route('admin.books.index')->with('success', 'Buku berhasil ditambahkan.');
    }

    public function edit(string $id)
    {
        $book = Book::findOrFail($id);

        return Inertia::render('Admin/Buku/Edit', [
            'book' => new BookResource($book),
        ]);
    }

    public function update(BookUpdateRequest $request, string $id)
    {
        $book = Book::findOrFail($id);

        if (! Gate::allows('update', $book)) {
            return back()->withErrors([
                'authorization' => 'Kamu tidak punya hak untuk menggunakan fitur ini.',
            ]);
        }

        $data = $request->safe()->only(['title', 'type', 'tags']);

        if ($request->hasFile('cover_url')) {
            $coverPath = $this->makeBookThumbnailPath($book->uuid);

            $this->storage->uploadImageAsWebp($request->file('cover_url'), $coverPath);
            $this->storage->delete($this->storage->extractPath($book->cover_url));
            $data['cover_url'] = $this->storage->buildUrl($coverPath);
        }

        $book->update($data);

        return redirect()->route('admin.books.index')->with('success', 'Buku berhasil diperbarui.');
    }

    public function upload(string $id)
    {
        $book = Book::findOrFail($id);

        return Inertia::render('Admin/Buku/Upload', [
            'book' => new BookResource($book),
        ]);
    }

    public function uploadFile(BookUploadFileRequest $request, string $id)
    {
        $book = Book::findOrFail($id);

        if (! Gate::allows('update', $book)) {
            return back()->withErrors([
                'authorization' => 'Kamu tidak punya hak untuk menggunakan fitur ini.',
            ]);
        }

        $data = $request->safe()->only(['url', 'version']);

        $book->update($data);

        return redirect()->route('admin.books.upload', $book->id)->with('success', 'File buku berhasil diperbarui.');
    }

    public function selection(Request $request)
    {
        $search = $request->input('search');

        $books = Book::query()
            ->when($search, function ($query, $search) {
                $query->where('title', 'like', "%{$search}%");
            })
            ->latest()
            ->limit(20)
            ->get(['id', 'title', 'cover_url']);

        return response()->json($books);
    }

    public function destroy(string $id)
    {
        $book = Book::findOrFail($id);

        if (! Gate::allows('delete', $book)) {
            return back()->withErrors([
                'authorization' => 'Kamu tidak punya hak untuk menggunakan fitur ini.',
            ]);
        }

        $book->delete();

        return redirect()->back()->with('success', 'Buku berhasil dihapus.');
    }

    public function sync(string $uuid)
    {
        $book = Book::query()
            ->where('uuid', $uuid)
            ->first();

        if (! $book) {
            return response()->json([
                'message' => 'Data buku database tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'data' => [
                'cover' => $book->thumbnail,
                'downloadLink' => $book->url ?? '',
                'version' => $book->version ?? 1,
            ],
        ]);
    }

    private function makeBookFilePath(UploadedFile $file, string $uuid): string
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $filename = Str::slug($originalName).'-'.uniqid().'.'.$extension;

        return "books/{$uuid}/{$filename}";
    }

    private function makeBookThumbnailPath(string $uuid): string
    {
        return "books/{$uuid}/thumbnail.webp";
    }
}

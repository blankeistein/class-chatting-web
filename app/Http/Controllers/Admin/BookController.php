<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\BookStoreRequest;
use App\Http\Requests\BookUpdateRequest;
use App\Http\Requests\BookUploadFileRequest;
use App\Http\Resources\BookResource;
use App\Models\Book;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Kreait\Laravel\Firebase\Facades\Firebase;

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
        $data = $request->safe()->only(['title', 'uuid', 'type', 'tags', 'url', 'version']);
        $data['uuid'] = filled($data['uuid'] ?? null) ? $data['uuid'] : (string) Str::uuid();

        if ($request->hasFile('cover_url')) {
            $coverPath = $this->makeBookThumbnailPath($data['uuid']);

            $this->uploadCoverToFirebaseAsWebp($request->file('cover_url'), $coverPath);
            $data['cover_url'] = $this->buildFirebaseUrl($coverPath);
        }

        if ($request->hasFile('book_file')) {
            $bookFile = $request->file('book_file');
            $storagePath = $this->makeBookFilePath($bookFile, $data['uuid']);

            $this->uploadFileToFirebase($bookFile, $storagePath);
            $data['url'] = $this->buildFirebaseUrl($storagePath);
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

        $data = $request->safe()->only(['title', 'type', 'tags']);

        if ($request->hasFile('cover_url')) {
            $coverPath = $this->makeBookThumbnailPath($book->uuid);

            $this->uploadCoverToFirebaseAsWebp($request->file('cover_url'), $coverPath);
            $this->deleteFirebaseObject($this->extractFirebasePath($book->cover_url));
            $data['cover_url'] = $this->buildFirebaseUrl($coverPath);
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
        $data = $request->safe()->only(['url', 'version']);

        if ($request->hasFile('book_file')) {
            $bookFile = $request->file('book_file');
            $storagePath = $this->makeBookFilePath($bookFile, $book->uuid);

            $this->uploadFileToFirebase($bookFile, $storagePath);
            $this->deleteFirebaseObject($this->extractFirebasePath($book->url));
            $data['url'] = $this->buildFirebaseUrl($storagePath);
        }

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
            ->limit(20) // Batasi biar gak berat, ntar pake search aja
            ->get(['id', 'title']);

        return response()->json($books);
    }

    public function destroy(string $id)
    {
        $book = Book::findOrFail($id);
        $book->delete();

        return redirect()->back()->with('success', 'Buku berhasil dihapus.');
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

    private function uploadFileToFirebase(UploadedFile $file, string $path): void
    {
        Firebase::storage()->getBucket()->upload(
            fopen($file->getPathname(), 'r'),
            ['name' => $path]
        );
    }

    private function uploadCoverToFirebaseAsWebp(UploadedFile $file, string $path): void
    {
        if (! function_exists('imagewebp')) {
            throw ValidationException::withMessages([
                'cover_url' => 'Server belum mendukung kompresi gambar ke WebP.',
            ]);
        }

        $image = $this->createImageResourceFromUploadedCover($file);
        $temporaryWebpPath = tempnam(sys_get_temp_dir(), 'book-cover-');

        if ($temporaryWebpPath === false) {
            imagedestroy($image);

            throw ValidationException::withMessages([
                'cover_url' => 'Gagal menyiapkan file cover sementara.',
            ]);
        }

        try {
            if (function_exists('imagepalettetotruecolor')) {
                imagepalettetotruecolor($image);
            }

            imagealphablending($image, true);
            imagesavealpha($image, true);

            if (! imagewebp($image, $temporaryWebpPath, 80)) {
                throw ValidationException::withMessages([
                    'cover_url' => 'Gagal mengompres cover buku ke format WebP.',
                ]);
            }

            Firebase::storage()->getBucket()->upload(
                fopen($temporaryWebpPath, 'r'),
                ['name' => $path]
            );
        } finally {
            imagedestroy($image);

            if (is_file($temporaryWebpPath)) {
                unlink($temporaryWebpPath);
            }
        }
    }

    private function createImageResourceFromUploadedCover(UploadedFile $file): \GdImage
    {
        $mimeType = $file->getMimeType();
        $pathname = $file->getPathname();

        $image = match ($mimeType) {
            'image/jpeg', 'image/jpg' => imagecreatefromjpeg($pathname),
            'image/png' => imagecreatefrompng($pathname),
            'image/gif' => imagecreatefromgif($pathname),
            'image/webp' => function_exists('imagecreatefromwebp') ? imagecreatefromwebp($pathname) : false,
            default => false,
        };

        if (! $image instanceof \GdImage) {
            throw ValidationException::withMessages([
                'cover_url' => 'Format cover buku tidak dapat diproses ke WebP.',
            ]);
        }

        return $image;
    }

    private function buildFirebaseUrl(string $path): string
    {
        $bucketName = config('services.firebase.storage_bucket');

        return "https://firebasestorage.googleapis.com/v0/b/{$bucketName}/o/".urlencode($path).'?alt=media';
    }

    private function extractFirebasePath(?string $url): ?string
    {
        if (! $url) {
            return null;
        }

        $bucketName = config('services.firebase.storage_bucket');
        $prefix = "https://firebasestorage.googleapis.com/v0/b/{$bucketName}/o/";

        if (! str_contains($url, $prefix)) {
            return null;
        }

        return urldecode(explode('?', str_replace($prefix, '', $url))[0]);
    }

    private function deleteFirebaseObject(?string $path): void
    {
        if (! $path) {
            return;
        }

        try {
            $object = Firebase::storage()->getBucket()->object($path);

            if ($object->exists()) {
                $object->delete();
            }
        } catch (\Exception $exception) {
            Log::error('Firebase object deletion failed: '.$exception->getMessage());
        }
    }
}

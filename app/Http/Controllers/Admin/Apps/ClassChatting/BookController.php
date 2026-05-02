<?php

namespace App\Http\Controllers\Admin\Apps\ClassChatting;

use App\Http\Controllers\Controller;
use App\Http\Requests\ClassChattingBookReorderRequest;
use App\Http\Requests\ClassChattingBookStoreRequest;
use App\Http\Requests\ClassChattingBookUpdateRequest;
use Google\Cloud\Firestore\FieldValue;
use Google\Cloud\Firestore\FirestoreClient;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Throwable;

class BookController extends Controller
{
    public function __construct(
        protected FirestoreClient $firestore,
    ) {}

    public function index(): InertiaResponse
    {
        return Inertia::render('Admin/Apps/ClassChatting/Book/Index');
    }

    public function indexRTDB(): InertiaResponse
    {
        return Inertia::render('Admin/Apps/ClassChatting/Book/IndexRTDB');
    }

    public function category(): InertiaResponse
    {
        return Inertia::render('Admin/Apps/ClassChatting/Book/Category');
    }

    public function store(ClassChattingBookStoreRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();
            $documentId = $validated['uuid'];
            $document = $this->booksCollection()->document($documentId);

            if ($document->snapshot()->exists()) {
                return response()->json([
                    'message' => 'Buku ini sudah ada di Firestore.',
                ], 409);
            }

            $document->set([
                'cover' => $validated['cover'] ?? '',
                'id' => $documentId,
                'bookPath' => $documentId,
                'playstoreId' => $documentId,
                'keyword' => implode(',', $validated['tags'] ?? []),
                'lock' => false,
                'name' => $validated['title'],
                'order' => $validated['order'],
                'price' => 0,
                'status' => 'publish',
                'downloadLink' => $validated['downloadLink'] ?? '',
                'version' => $validated['version'] ?? 1,
                'createdAt' => FieldValue::serverTimestamp(),
                'updatedAt' => FieldValue::serverTimestamp(),
            ]);

            return response()->json([
                'message' => 'Buku berhasil ditambahkan ke Firestore.',
            ], 201);
        } catch (Throwable $exception) {
            return response()->json([
                'message' => 'Gagal menambahkan buku ke Firestore: '.$exception->getMessage(),
            ], 500);
        }
    }

    public function update(ClassChattingBookUpdateRequest $request, string $documentId): JsonResponse
    {
        try {
            $validated = $request->validated();
            $document = $this->booksCollection()->document($documentId);

            if (! $document->snapshot()->exists()) {
                return response()->json([
                    'message' => 'Data buku Firestore tidak ditemukan.',
                ], 404);
            }

            $document->set([
                'cover' => $validated['cover'] ?? '',
                'id' => $validated['id'],
                'bookPath' => $validated['bookPath'],
                'playstoreId' => $validated['playstoreId'] ?? '',
                'keyword' => $validated['keyword'] ?? '',
                'lock' => $validated['lock'],
                'name' => $validated['name'],
                'order' => $validated['order'],
                'price' => $validated['price'],
                'status' => $validated['status'],
                'downloadLink' => $validated['downloadLink'] ?? '',
                'version' => $validated['version'],
                'updatedAt' => FieldValue::serverTimestamp(),
            ], [
                'merge' => true,
            ]);

            return response()->json([
                'message' => 'Data buku berhasil diperbarui.',
            ]);
        } catch (Throwable $exception) {
            return response()->json([
                'message' => 'Gagal memperbarui data buku: '.$exception->getMessage(),
            ], 500);
        }
    }

    public function reorder(ClassChattingBookReorderRequest $request): JsonResponse
    {
        try {
            foreach ($request->validated()['books'] as $book) {
                $this->booksCollection()->document($book['originalKey'])->set([
                    'order' => $book['order'],
                    'updatedAt' => FieldValue::serverTimestamp(),
                ], [
                    'merge' => true,
                ]);
            }

            return response()->json([
                'message' => 'Urutan buku berhasil disimpan.',
            ]);
        } catch (Throwable $exception) {
            return response()->json([
                'message' => 'Gagal menyimpan urutan buku: '.$exception->getMessage(),
            ], 500);
        }
    }

    private function booksCollection()
    {
        return $this->firestore->collection('books');
    }
}

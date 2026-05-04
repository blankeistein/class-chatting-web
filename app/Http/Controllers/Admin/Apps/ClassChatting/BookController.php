<?php

namespace App\Http\Controllers\Admin\Apps\ClassChatting;

use App\Enums\AppEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\ClassChattingBookReorderRequest;
use App\Http\Requests\ClassChattingBookStoreRequest;
use App\Http\Requests\ClassChattingBookUpdateRequest;
use App\Models\Book as DatabaseBook;
use App\Models\BookIntegration;
use Google\Cloud\Firestore\FieldValue;
use Google\Cloud\Firestore\FirestoreClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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

    public function sync(string $uuid): JsonResponse
    {
        $book = DatabaseBook::query()
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

    public function store(ClassChattingBookStoreRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();
            $documentId = $validated['uuid'];
            $book = DatabaseBook::query()
                ->where('uuid', $documentId)
                ->first();

            if (! $book) {
                return response()->json([
                    'message' => 'Data buku database tidak ditemukan.',
                ], 404);
            }

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
                'keyword' => $validated['keyword'] ? implode(',', $validated['keyword']) : '',
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

            BookIntegration::query()->firstOrCreate([
                'book_id' => $book->id,
                'app_key' => AppEnum::CLASS_CHATTING->value,
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
                'keyword' => $validated['keyword'] ? implode(',', $validated['keyword']) : '',
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

    public function updateLock(Request $request, string $documentId): JsonResponse
    {
        try {
            $lockStatus = $request->boolean('lock');
            $document = $this->booksCollection()->document($documentId);

            if (! $document->snapshot()->exists()) {
                return response()->json([
                    'message' => 'Data buku Firestore tidak ditemukan.',
                ], 404);
            }

            $document->set([
                'lock' => $lockStatus,
                'updatedAt' => FieldValue::serverTimestamp(),
            ], [
                'merge' => true,
            ]);

            return response()->json([
                'message' => 'Status kunci buku berhasil diperbarui.',
            ]);
        } catch (Throwable $exception) {
            return response()->json([
                'message' => 'Gagal memperbarui status kunci buku: '.$exception->getMessage(),
            ], 500);
        }
    }

    public function reorder(ClassChattingBookReorderRequest $request): JsonResponse
    {
        try {
            $this->batchUpdateBookOrders(
                collect($request->validated()['books'])
                    ->map(fn (array $book): array => [
                        'id' => $book['originalKey'],
                        'order' => $book['order'],
                    ])
                    ->all()
            );

            return response()->json([
                'message' => 'Urutan buku berhasil disimpan.',
            ]);
        } catch (Throwable $exception) {
            return response()->json([
                'message' => 'Gagal menyimpan urutan buku: '.$exception->getMessage(),
            ], 500);
        }
    }

    public function destroy(string $documentId): JsonResponse
    {
        try {
            $book = DatabaseBook::query()
                ->where('uuid', $documentId)
                ->first();
            $document = $this->booksCollection()->document($documentId);
            $snapshot = $document->snapshot();

            if (! $snapshot->exists()) {
                return response()->json([
                    'message' => 'Data buku Firestore tidak ditemukan.',
                ], 404);
            }

            $deletedOrder = (int) ($snapshot['order'] ?? 0);
            $document->delete();

            $documents = $this->booksCollection()->documents();
            $affectedBooks = [];

            foreach ($documents as $snapshot) {
                if (! $snapshot->exists()) {
                    continue;
                }

                $currentOrder = (int) ($snapshot['order'] ?? 0);

                if ($currentOrder <= $deletedOrder) {
                    continue;
                }

                $affectedBooks[] = [
                    'id' => $snapshot->id(),
                    'name' => (string) ($snapshot['name'] ?? ''),
                    'order' => $currentOrder,
                ];
            }

            usort($affectedBooks, function (array $left, array $right): int {
                if ($left['order'] !== $right['order']) {
                    return $left['order'] <=> $right['order'];
                }

                return strcasecmp($left['name'], $right['name']);
            });

            $this->batchUpdateBookOrders(
                array_map(
                    fn (array $book, int $index): array => [
                        'id' => $book['id'],
                        'order' => $deletedOrder + $index,
                    ],
                    array_values($affectedBooks),
                    array_keys(array_values($affectedBooks))
                )
            );

            if ($book) {
                BookIntegration::query()
                    ->where('book_id', $book->id)
                    ->where('app_key', AppEnum::CLASS_CHATTING->value)
                    ->delete();
            }

            return response()->json([
                'message' => 'Buku berhasil dihapus dari Firestore.',
            ]);
        } catch (Throwable $exception) {
            return response()->json([
                'message' => 'Gagal menghapus buku dari Firestore: '.$exception->getMessage(),
            ], 500);
        }
    }

    private function booksCollection()
    {
        return $this->firestore->collection('books');
    }

    private function batchUpdateBookOrders(array $books): void
    {
        $uniqueBooks = [];

        foreach ($books as $book) {
            $uniqueBooks[$book['id']] = [
                'id' => $book['id'],
                'order' => $book['order'],
            ];
        }

        foreach (array_chunk(array_values($uniqueBooks), 5) as $chunk) {
            $writer = $this->firestore->bulkWriter();

            foreach ($chunk as $book) {
                $writer->update(
                    $this->booksCollection()->document($book['id']),
                    [
                        ['path' => 'order', 'value' => $book['order']],
                        ['path' => 'updatedAt', 'value' => FieldValue::serverTimestamp()],
                    ]
                );
            }

            $writer->commit();
        }
    }
}

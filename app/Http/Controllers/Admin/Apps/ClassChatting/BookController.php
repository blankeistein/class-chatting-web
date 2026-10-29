<?php

namespace App\Http\Controllers\Admin\Apps\ClassChatting;

use App\Enums\AppEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\ClassChatting\BookBulkActionRequest;
use App\Http\Requests\ClassChatting\BookReorderRequest;
use App\Http\Requests\ClassChatting\BookStoreRequest;
use App\Http\Requests\ClassChatting\BookUpdateRequest;
use App\Models\Book as DatabaseBook;
use App\Models\BookIntegration;
use Google\Cloud\Firestore\FieldValue;
use Google\Cloud\Firestore\FirestoreClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Kreait\Firebase\Contract\Database;
use Kreait\Firebase\Database\Transaction;
use Kreait\Firebase\Exception\Database\TransactionFailed;
use Throwable;

class BookController extends Controller
{
    public function __construct(
        protected FirestoreClient $firestore,
        protected Database $database,
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

    public function store(BookStoreRequest $request): JsonResponse
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
                'keyword' => $validated['tags'] ? implode(',', $validated['tags']) : '',
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

            $this->incrementBooksCatalogVersion($documentId);

            return response()->json([
                'message' => 'Buku berhasil ditambahkan ke Firestore.',
            ], 201);
        } catch (Throwable $exception) {
            return response()->json([
                'message' => 'Gagal menambahkan buku ke Firestore: '.$exception->getMessage(),
            ], 500);
        }
    }

    public function update(BookUpdateRequest $request, string $documentId): JsonResponse
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
                'isFreemium' => (bool) ($validated['isFreemium'] ?? false),
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

            $this->incrementBooksCatalogVersion($documentId);

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

            $this->incrementBooksCatalogVersion($documentId);

            return response()->json([
                'message' => 'Status kunci buku berhasil diperbarui.',
            ]);
        } catch (Throwable $exception) {
            return response()->json([
                'message' => 'Gagal memperbarui status kunci buku: '.$exception->getMessage(),
            ], 500);
        }
    }

    public function reorder(BookReorderRequest $request): JsonResponse
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

            $this->incrementBooksCatalogVersion();

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

            $this->incrementBooksCatalogVersion($documentId);

            return response()->json([
                'message' => 'Buku berhasil dihapus dari Firestore.',
            ]);
        } catch (Throwable $exception) {
            return response()->json([
                'message' => 'Gagal menghapus buku dari Firestore: '.$exception->getMessage(),
            ], 500);
        }
    }

    public function bulkAction(BookBulkActionRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $action = $validated['action'];
        $keys = array_values(array_unique($validated['keys']));

        try {
            if ($action === 'delete') {
                $deletedOrders = [];
                $writer = $this->firestore->bulkWriter();

                foreach ($keys as $key) {
                    $docRef = $this->booksCollection()->document($key);
                    $snapshot = $docRef->snapshot();
                    if ($snapshot->exists()) {
                        $deletedOrders[] = (int) ($snapshot['order'] ?? 0);
                        $writer->delete($docRef);
                    }
                }
                $writer->commit();

                // Delete integrations in mysql
                $books = DatabaseBook::query()->whereIn('uuid', $keys)->get();
                if ($books->isNotEmpty()) {
                    BookIntegration::query()
                        ->whereIn('book_id', $books->pluck('id'))
                        ->where('app_key', AppEnum::CLASS_CHATTING->value)
                        ->delete();
                }

                // Resequence remaining books
                $documents = $this->booksCollection()->documents();
                $remainingBooks = [];
                foreach ($documents as $snapshot) {
                    if (! $snapshot->exists() || in_array($snapshot->id(), $keys, true)) {
                        continue;
                    }
                    $remainingBooks[] = [
                        'id' => $snapshot->id(),
                        'name' => (string) ($snapshot['name'] ?? ''),
                        'order' => (int) ($snapshot['order'] ?? 0),
                    ];
                }

                usort($remainingBooks, function (array $left, array $right): int {
                    if ($left['order'] !== $right['order']) {
                        return $left['order'] <=> $right['order'];
                    }

                    return strcasecmp($left['name'], $right['name']);
                });

                $this->batchUpdateBookOrders(
                    array_map(
                        fn (array $book, int $index): array => [
                            'id' => $book['id'],
                            'order' => $index + 1,
                        ],
                        array_values($remainingBooks),
                        array_keys(array_values($remainingBooks))
                    )
                );

                $this->incrementBooksCatalogVersion();

                return response()->json([
                    'message' => count($keys).' buku berhasil dihapus.',
                ]);
            }

            if ($action === 'status') {
                $status = $validated['status'];
                $writer = $this->firestore->bulkWriter();

                foreach ($keys as $key) {
                    $docRef = $this->booksCollection()->document($key);
                    $writer->update($docRef, [
                        ['path' => 'status', 'value' => $status],
                        ['path' => 'updatedAt', 'value' => FieldValue::serverTimestamp()],
                    ]);
                }
                $writer->commit();

                $this->incrementBooksCatalogVersion();

                return response()->json([
                    'message' => 'Status '.count($keys).' buku berhasil diubah menjadi '.strtoupper($status).'.',
                ]);
            }

            if ($action === 'lock') {
                $lockStatus = (bool) $validated['lock'];
                $writer = $this->firestore->bulkWriter();

                foreach ($keys as $key) {
                    $docRef = $this->booksCollection()->document($key);
                    $writer->update($docRef, [
                        ['path' => 'lock', 'value' => $lockStatus],
                        ['path' => 'updatedAt', 'value' => FieldValue::serverTimestamp()],
                    ]);
                }
                $writer->commit();

                $this->incrementBooksCatalogVersion();

                return response()->json([
                    'message' => count($keys).' buku berhasil '.($lockStatus ? 'dikunci' : 'dibuka kuncinya').'.',
                ]);
            }

            return response()->json([
                'message' => 'Aksi tidak dikenali.',
            ], 422);
        } catch (Throwable $exception) {
            return response()->json([
                'message' => 'Gagal memproses aksi massal: '.$exception->getMessage(),
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

    private function incrementBooksCatalogVersion(?string $bookId = null): void
    {
        $maxAttempts = 3;
        $attempt = 0;

        while ($attempt < $maxAttempts) {
            $attempt++;

            try {
                $newVersion = $this->database->runTransaction(function (Transaction $transaction): int {
                    $ref = $this->database->getReference('settings/booksCatalogVersion');
                    $snapshot = $transaction->snapshot($ref);
                    $currentValue = $snapshot->getValue();
                    $newValue = ((int) ($currentValue ?? 0)) + 1;
                    $transaction->set($ref, $newValue);

                    return $newValue;
                });

                Log::info("Berhasil menaikkan booksCatalogVersion di RTDB untuk buku {$bookId}", [
                    'bookId' => $bookId,
                    'newVersion' => $newVersion,
                ]);

                return;
            } catch (TransactionFailed $e) {
                if ($attempt >= $maxAttempts) {
                    Log::error("Gagal menaikkan booksCatalogVersion di RTDB untuk buku {$bookId} setelah {$maxAttempts} percobaan", [
                        'bookId' => $bookId,
                        'error' => $e->getMessage(),
                    ]);
                }
            } catch (Throwable $e) {
                Log::error("Gagal menaikkan booksCatalogVersion di RTDB untuk buku {$bookId}", [
                    'bookId' => $bookId,
                    'error' => $e->getMessage(),
                ]);

                return;
            }
        }
    }
}

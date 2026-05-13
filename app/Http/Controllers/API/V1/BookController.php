<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\BookResource;
use App\Models\ActivationCode;
use App\Models\Book;
use App\Models\User;
use App\Models\UserBook;
use Dedoc\Scramble\Attributes\BodyParameter;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\PathParameter;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

#[Group('Public Books V1', 'Endpoint publik versi 1 untuk aktivasi buku dan pengecekan level kode aktivasi.', 20)]
class BookController extends Controller
{
    private array $tester = ['nvRVUlsMQ9Q3se6gJbvCIsGG5k53', '3Psyf8Gb2iOIMXjzv1C7dqculQz2', 'DPdbFiuzk3NkCQn9X36l4k5bnLu2', 'zTctHzi7N4hdD0g7BjXIEONpbud2', 'voijgBsUiDeFxOW2p2KqMlxxbL32', 'cKoJY2E3nLNzYv023XIIdq4cTs23', 'ArxTzz5LfldwSu0MC7aW5Ce6njr2', 'gPq2Gu33cZSajWlHbZFAz82LXNz2', 'Yzy9GJTyoUgqXHms4zxNzz3auGM2', 'buE1H0Fc31UR54oO94HzQQM7Rzo2', 'dMhQmdphV0fGFG0BNhSE2twfrCk2', 'IlVd8Ci2QPQUmT4aYXrhOH1VGj72'];

    public function index(Request $request): AnonymousResourceCollection
    {
        $search = $request->input('search');

        $books = Book::query()
            ->when($search, function ($query, $search) {
                $query->where('title', 'like', "%{$search}%");
            })
            ->latest()
            ->get();

        return BookResource::collection($books);
    }

    #[Endpoint(
        operationId: 'publicBooksActivateV1',
        title: 'Activate book code v1',
        description: 'Memvalidasi kode aktivasi untuk sebuah buku dan mengaitkannya ke pengguna pada endpoint versi 1.'
    )]
    #[BodyParameter('api_key', 'API key aplikasi publik yang diharapkan server.', required: true, example: 'public-app-key')]
    #[BodyParameter('code', 'Kode aktivasi buku.', required: true, example: 'AKTIVASI-001')]
    #[BodyParameter('uid', 'Firebase UID atau identifier unik pengguna yang melakukan aktivasi.', required: true, example: 'firebase-user-001')]
    #[BodyParameter('package_name', 'UUID buku yang akan diaktivasi.', required: true, example: 'book-uuid-001')]
    #[BodyParameter('tier', 'Tier buku yang diharapkan. Gunakan `1` untuk Regular dan `2` untuk Premium.', required: true, type: 'integer', example: 1)]
    public function activate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'api_key' => 'required',
            'code' => 'required',
            'uid' => 'required',
            'package_name' => 'required',
            'tier' => 'required',
        ], [
            'code.required' => 'Mohon masukkan kode aktivasi! [104]',
            'uid.required' => 'Mohon update aplikasi yang anda gunakan! [105]',
            'package_name.required' => 'ID buku kosong. [103]',
            'tier.required' => 'Mohon update aplikasi yang anda gunakan! [105]',
        ]);

        if ($validator->fails()) {
            $field = array_key_first($validator->errors()->toArray());
            $errorCodes = [
                'code' => 104,
                'uid' => 105,
                'package_name' => 103,
                'tier' => 105,
            ];

            return $this->errorResponse($errorCodes[$field] ?? 101, $validator->errors()->first());
        }

        $validateData = $validator->validated();

        if ($validateData['code'] === 'lestariilmu') {
            if (in_array($validateData['api_key'], $this->tester, true)) {
                return response()->json([
                    'status' => 'success',
                    'error_code' => 200,
                    'message' => '[Anda adalah seorang Tester] Kode berhasil diaktifkan.',
                ]);
            }

            return $this->errorResponse(999, '[999] Anda tidak tergabung dengan team pengembang. Kode tidak bisa diaktivasi');
        }

        if ($validateData['api_key'] !== config('app.api_key')) {
            return $this->errorResponse(102, 'Mohon maaf aplikasi anda sudah usang, update aplikasi ke versi paling baru. [102]');
        }

        try {
            return DB::transaction(function () use ($validateData) {
                $code = ActivationCode::query()
                    ->with(['items.model', 'activatedIn.model'])
                    ->where('code', $validateData['code'])
                    ->lockForUpdate()
                    ->first();

                if (! $code) {
                    return $this->errorResponse(106, 'Kode yang anda masukkan tidak valid. [106]');
                }

                if (! $code->is_active) {
                    return $this->errorResponse(108, 'Mohon maaf, Kode ini tidak aktif atau sudah dinonaktifkan. [108]');
                }

                if ($code->max_activated !== null && $code->times_activated >= $code->max_activated) {
                    return $this->errorResponse(113, 'Mohon maaf, Kode sudah mencapai batas pengaktifan. [113]');
                }

                $book = Book::query()->where('uuid', $validateData['package_name'])->first();

                if (! $book) {
                    return $this->errorResponse(107, 'Buku belum terdaftar, Mohon laporkan ini ke Customer Service kami. Terima Kasih :) [107]');
                }

                $supportedBooksKey = $code->items->pluck('model.uuid')->filter()->toArray();

                if (empty($supportedBooksKey) || ! in_array($validateData['package_name'], $supportedBooksKey, true)) {
                    return $this->errorResponse(108, "Kode yang anda masukkan tidak cocok untuk buku {$book->title}. Silahkan cek kode yang anda gunakan! [108A]");
                }

                if (! empty($validateData['tier']) && (int) $validateData['tier'] !== $code->tier->value) {
                    return $this->errorResponse(114, 'Kode tidak cocok diaktifkan disini. [114]');
                }

                $nextTimesActivated = $code->times_activated + 1;

                if ($code->type === 'public') {
                    $code->update([
                        'activated_at' => now(),
                        'times_activated' => $nextTimesActivated,
                    ]);
                } else {
                    if (! empty($code->user_id) && $code->user_id !== $validateData['uid']) {
                        return $this->errorResponse(109, 'Maaf kode yang anda masukkan sudah diaktifkan di akun lain [109]');
                    }

                    if ($code->activatedIn !== null && $code->activatedIn->model->id !== $book->id) {
                        $activatedBook = $code->activatedIn->model;
                        $activatedBookTitle = $activatedBook?->title ?? 'buku lain';

                        return $this->errorResponse(110, "Maaf kode yang anda masukkan sudah aktif di buku {$activatedBookTitle} [110]");
                    }

                    $updated = [
                        'times_activated' => $nextTimesActivated,
                    ];

                    if (! $code->activated_in) {
                        $activationItem = $code->items->where('model_id', $book->id)->first();

                        $updated['activated_in'] = $activationItem->id;
                        $updated['user_id'] = $validateData['uid'];
                        $updated['activated_at'] = now();
                    }

                    $code->update($updated);
                }

                $user = User::where('firebase_uid', $validateData['uid'])->first();

                if ($user) {
                    UserBook::updateOrCreate(
                        [
                            'user_id' => $user->id,
                            'book_id' => $book->id,
                            'activation_code_id' => $code->id,
                        ]
                    );
                }

                $message = 'Kode berhasil diaktifkan. Semoga harimu menyenangkan :)';

                if ($code->max_activated) {
                    $limit = $code->max_activated - $nextTimesActivated;
                    $message = "Kode berhasil diaktifkan. \nKode bisa diaktifkan {$limit} kali lagi";
                }

                Log::channel('activation-code')->info('Activation code activated', [
                    'user_id' => $validateData['uid'],
                    'code' => $validateData['code'],
                ]);

                return response()->json([
                    'status' => 'success',
                    'message' => $message,
                    'version' => 1,
                ]);
            });
        } catch (Exception $except) {
            return $this->errorResponse(500, 'Terjadi kesalahan pada server. '.$except->getMessage());
        }
    }

    #[Endpoint(
        operationId: 'publicBooksActivationLevelV1',
        title: 'Check activation code level v1',
        description: 'Mengembalikan tier atau level dari sebuah kode aktivasi apabila kode tersebut valid pada endpoint versi 1.'
    )]
    #[PathParameter('code', 'Kode aktivasi yang akan dicek levelnya.', example: 'AKTIVASI-001')]
    public function activationCheckLevel(string $code): JsonResponse
    {
        try {
            $activationCode = ActivationCode::query()->where('code', trim($code))->first();

            if (! $activationCode) {
                return $this->errorResponse(0, 'Kode aktivasi tidak valid.');
            }

            return response()->json([
                'status' => 'success',
                'level' => [
                    'slug' => $activationCode->tier->value,
                    'name' => $activationCode->tier->label(),
                ],
                'version' => 1,
            ]);
        } catch (Exception $except) {
            return $this->errorResponse(0, 'Terjadi kesalahan pada server. '.$except->getMessage());
        }
    }

    private function errorResponse(int $errorCode, string $message): JsonResponse
    {
        $response = [
            'status' => 'error',
            'message' => $message,
            'version' => 1,
        ];

        if ($errorCode > 0) {
            $response['error_code'] = $errorCode;
        }

        return response()->json($response);
    }
}

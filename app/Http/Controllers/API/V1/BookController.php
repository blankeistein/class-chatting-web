<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\BookResource;
use App\Models\ActivationCode;
use App\Models\Book;
use Dedoc\Scramble\Attributes\BodyParameter;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\PathParameter;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
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

            return response()->json([
                'status' => 'error',
                'error_code' => $errorCodes[$field] ?? 101,
                'message' => $validator->errors()->first(),
                'version' => 1,
            ]);
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

            return response()->json([
                'status' => 'error',
                'error_code' => 999,
                'message' => '[999] Anda tidak tergabung dengan team pengembang. Kode tidak bisa diaktivasi',
                'version' => 1,
            ]);
        }

        if ($validateData['api_key'] !== config('app.api_key')) {
            return response()->json([
                'status' => 'error',
                'error_code' => 102,
                'message' => 'Mohon maaf aplikasi anda sudah usang, update aplikasi ke versi paling baru. [102]',
                'version' => 1,
            ]);
        }

        $code = ActivationCode::query()->where('code', $validateData['code'])->first();

        if (! $code) {
            return response()->json([
                'status' => 'error',
                'error_code' => 106,
                'message' => 'Kode yang anda masukkan tidak valid. [106]',
                'version' => 1,
            ]);
        }

        if (! $code->is_active) {
            return response()->json([
                'status' => 'error',
                'error_code' => 108,
                'message' => 'Mohon maaf, Kode ini tidak aktif atau sudah dinonaktifkan. [108]',
                'version' => 1,
            ]);
        }

        if ($code->max_activated !== null && $code->times_activated >= $code->max_activated) {
            return response()->json([
                'status' => 'error',
                'error_code' => 113,
                'message' => 'Mohon maaf, Kode sudah mencapai batas pengaktifan. [113]',
                'version' => 1,
            ]);
        }

        $book = Book::query()->where('uuid', $validateData['package_name'])->first();

        if (! $book) {
            return response()->json([
                'status' => 'error',
                'error_code' => 107,
                'message' => 'Buku belum terdaftar, Mohon laporkan ini ke Customer Service kami. Terima Kasih :) [107]',
                'version' => 1,
            ]);
        }

        $supportedBooksKey = $code->items->pluck('model.uuid')->filter()->toArray();

        if (empty($supportedBooksKey) || ! in_array($validateData['package_name'], $supportedBooksKey, true)) {
            return response()->json([
                'status' => 'error',
                'error_code' => 108,
                'message' => "Kode yang anda masukkan tidak cocok untuk buku {$book->title}. Silahkan cek kode yang anda gunakan! [108A]",
                'version' => 1,
            ]);
        }

        if (! empty($validateData['tier']) && (int) $validateData['tier'] !== $code->tier->value) {
            return response()->json([
                'status' => 'error',
                'error_code' => 114,
                'message' => 'Kode tidak cocok diaktifkan disini. [114]',
                'version' => 1,
            ]);
        }

        if ($code->type !== 'public') {
            if (! empty($code->user_id) && $code->user_id !== $validateData['uid']) {
                return response()->json([
                    'status' => 'error',
                    'error_code' => 109,
                    'message' => 'Maaf kode yang anda masukkan sudah diaktifkan di akun lain [109]',
                    'version' => 1,
                ]);
            }

            if ($code->activate_in !== null && $code->activate_in !== $book->id) {
                $activatedBook = Book::query()->find($code->activate_in);

                return response()->json([
                    'status' => 'error',
                    'error_code' => 110,
                    'message' => "Maaf kode yang anda masukkan sudah aktif di buku {$activatedBook->title} [110]",
                    'version' => 1,
                ]);
            }
        }

        $code->update([
            'user_id' => $validateData['uid'],
            'activate_in' => $book->id,
            'activated_at' => now(),
            'times_activated' => $code->times_activated + 1,
        ]);

        $message = 'Kode berhasil diaktifkan. Semoga harimu menyenangkan :)';

        if ($code->max_activated) {
            $limit = $code->max_activated - $code->times_activated;
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
    }

    #[Endpoint(
        operationId: 'publicBooksActivationLevelV1',
        title: 'Check activation code level v1',
        description: 'Mengembalikan tier atau level dari sebuah kode aktivasi apabila kode tersebut valid pada endpoint versi 1.'
    )]
    #[PathParameter('code', 'Kode aktivasi yang akan dicek levelnya.', example: 'AKTIVASI-001')]
    public function activationCheckLevel(Request $request, string $code): JsonResponse
    {
        try {
            $activationCode = ActivationCode::query()->where('code', trim($code))->first();

            if (! $activationCode) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Kode aktivasi tidak valid.',
                    'version' => 1,
                ]);
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
            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan pada server. '.$except->getMessage(),
                'version' => 1,
            ]);
        }
    }
}

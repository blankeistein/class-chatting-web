<?php

namespace App\Http\Controllers\API\V2;

use App\Http\Controllers\Controller;
use App\Models\ActivationCode;
use App\Models\Book;
use Dedoc\Scramble\Attributes\BodyParameter;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\HeaderParameter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

#[Group('Public Books V2', 'Endpoint publik versi 2 untuk aktivasi buku dengan pengamanan transaksi.', 21)]
class BookController extends Controller
{
    #[Endpoint(
        operationId: 'publicBooksActivateV2',
        title: 'Activate book code v2',
        description: 'Memvalidasi kode aktivasi untuk sebuah buku dan mengaitkannya ke pengguna pada endpoint versi 2 dengan Firebase bearer token dan transaksi database untuk mencegah race condition.'
    )]
    #[HeaderParameter('Authorization', 'Firebase ID token bearer. Format: `Bearer <firebase_id_token>`.', required: true, example: 'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...')]
    #[BodyParameter('code', 'Kode aktivasi buku.', required: true, example: 'AKTIVASI-001')]
    #[BodyParameter('package_name', 'UUID buku yang akan diaktivasi.', required: true, example: 'book-uuid-001')]
    #[BodyParameter('tier', 'Tier buku yang diharapkan. Gunakan `1` untuk Regular dan `2` untuk Premium.', required: true, type: 'integer', example: 1)]
    public function activate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required',
            'package_name' => 'required',
            'tier' => 'required',
        ], [
            'code.required' => 'Mohon masukkan kode aktivasi! [104]',
            'package_name.required' => 'ID buku kosong. [103]',
            'tier.required' => 'Mohon update aplikasi yang anda gunakan! [105]',
        ]);

        if ($validator->fails()) {
            $field = array_key_first($validator->errors()->toArray());
            $errorCodes = [
                'code' => 104,
                'package_name' => 103,
                'tier' => 105,
            ];

            return response()->json([
                'status' => 'error',
                'error_code' => $errorCodes[$field] ?? 101,
                'message' => $validator->errors()->first(),
                'version' => 2,
            ]);
        }

        $validateData = [
            'code' => trim((string) $validator->validated()['code']),
            'uid' => trim((string) $request->attributes->get('firebase_uid')),
            'package_name' => trim((string) $validator->validated()['package_name']),
            'tier' => $validator->validated()['tier'],
        ];

        return DB::transaction(function () use ($validateData) {
            $code = ActivationCode::query()
                ->with('items.model')
                ->where('code', $validateData['code'])
                ->lockForUpdate()
                ->first();

            if (! $code) {
                return response()->json([
                    'status' => 'error',
                    'error_code' => 106,
                    'message' => 'Kode yang anda masukkan tidak valid. [106]',
                    'version' => 2,
                ]);
            }

            if (! $code->is_active) {
                return response()->json([
                    'status' => 'error',
                    'error_code' => 108,
                    'message' => 'Mohon maaf, Kode ini tidak aktif atau sudah dinonaktifkan. [108]',
                    'version' => 2,
                ]);
            }

            if ($code->max_activated !== null && $code->times_activated >= $code->max_activated) {
                return response()->json([
                    'status' => 'error',
                    'error_code' => 113,
                    'message' => 'Mohon maaf, Kode sudah mencapai batas pengaktifan. [113]',
                    'version' => 2,
                ]);
            }

            $book = Book::query()->where('uuid', $validateData['package_name'])->first();

            if (! $book) {
                return response()->json([
                    'status' => 'error',
                    'error_code' => 107,
                    'message' => 'Buku belum terdaftar, Mohon laporkan ini ke Customer Service kami. Terima Kasih :) [107]',
                    'version' => 2,
                ]);
            }

            $supportedBooksKey = $code->items->pluck('model.uuid')->filter()->toArray();

            if (empty($supportedBooksKey) || ! in_array($validateData['package_name'], $supportedBooksKey, true)) {
                return response()->json([
                    'status' => 'error',
                    'error_code' => 108,
                    'message' => "Kode yang anda masukkan tidak cocok untuk buku {$book->title}. Silahkan cek kode yang anda gunakan! [108A]",
                    'version' => 2,
                ]);
            }

            if (! empty($validateData['tier']) && (int) $validateData['tier'] !== $code->tier->value) {
                return response()->json([
                    'status' => 'error',
                    'error_code' => 114,
                    'message' => 'Kode tidak cocok diaktifkan disini. [114]',
                    'version' => 2,
                ]);
            }

            if ($code->type !== 'public') {
                if (! empty($code->user_id) && $code->user_id !== $validateData['uid']) {
                    return response()->json([
                        'status' => 'error',
                        'error_code' => 109,
                        'message' => 'Maaf kode yang anda masukkan sudah diaktifkan di akun lain [109]',
                        'version' => 2,
                    ]);
                }

                if ($code->activate_in !== null && $code->activate_in !== $book->id) {
                    $activatedBook = Book::query()->find($code->activate_in);
                    $activatedBookTitle = $activatedBook?->title ?? 'buku lain';

                    return response()->json([
                        'status' => 'error',
                        'error_code' => 110,
                        'message' => "Maaf kode yang anda masukkan sudah aktif di buku {$activatedBookTitle} [110]",
                        'version' => 2,
                    ]);
                }
            }

            $nextTimesActivated = $code->times_activated + 1;

            $code->update([
                'user_id' => $validateData['uid'],
                'activate_in' => $book->id,
                'activated_at' => now(),
                'times_activated' => $nextTimesActivated,
            ]);

            $message = 'Kode berhasil diaktifkan. Semoga harimu menyenangkan :)';

            if ($code->max_activated) {
                $limit = $code->max_activated - $nextTimesActivated;
                $message = "Kode berhasil diaktifkan. \nKode bisa diaktifkan {$limit} kali lagi";
            }

            Log::channel('activation-code')->info('Activation code activated', [
                'user_id' => $validateData['uid'],
                'code' => $validateData['code'],
                'version' => 2,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => $message,
                'version' => 2,
            ]);
        });
    }
}

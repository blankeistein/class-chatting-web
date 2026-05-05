<?php

namespace App\Http\Controllers\API\V2;

use App\Http\Controllers\Controller;
use App\Models\ActivationCode;
use App\Models\Book;
use App\Models\User;
use App\Models\UserBook;
use Dedoc\Scramble\Attributes\BodyParameter;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\HeaderParameter;
use Dedoc\Scramble\Attributes\PathParameter;
use Exception;
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
    #[BodyParameter('id', 'UUID buku yang akan diaktivasi.', required: true, example: 'book-uuid-001')]
    #[BodyParameter('tier', 'Tier buku yang diharapkan. Gunakan `1` untuk Regular dan `2` untuk Premium.', required: true, type: 'integer', example: 1)]
    public function activate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required',
            'id' => 'required',
            'tier' => 'required',
        ], [
            'code.required' => 'Mohon masukkan kode aktivasi! [104]',
            'id.required' => 'ID buku kosong. [103]',
            'tier.required' => 'Mohon update aplikasi yang anda gunakan! [105]',
        ]);

        if ($validator->fails()) {
            $field = array_key_first($validator->errors()->toArray());
            $errorCodes = [
                'code' => 104,
                'id' => 103,
                'tier' => 105,
            ];

            return $this->errorResponse(422, $errorCodes[$field] ?? 101, $validator->errors()->first());
        }

        $validateData = [
            'code' => trim((string) $validator->validated()['code']),
            'uid' => trim((string) $request->attributes->get('firebase_uid')),
            'id' => trim((string) $validator->validated()['id']),
            'tier' => $validator->validated()['tier'],
        ];

        try {
            return DB::transaction(function () use ($validateData) {
                $code = ActivationCode::query()
                    ->with('items.model')
                    ->where('code', $validateData['code'])
                    ->lockForUpdate()
                    ->first();

                if (! $code) {
                    return $this->errorResponse(404, 106, 'Kode yang anda masukkan tidak valid. [106]');
                }

                if (! $code->is_active) {
                    return $this->errorResponse(403, 108, 'Mohon maaf, Kode ini tidak aktif atau sudah dinonaktifkan. [108]');
                }

                if ($code->max_activated !== null && $code->times_activated >= $code->max_activated) {
                    return $this->errorResponse(409, 113, 'Mohon maaf, Kode sudah mencapai batas pengaktifan. [113]');
                }

                $book = Book::query()->where('uuid', $validateData['id'])->first();

                if (! $book) {
                    return $this->errorResponse(404, 107, 'Buku belum terdaftar, Mohon laporkan ini ke Customer Service kami. Terima Kasih :) [107]');
                }

                $supportedBooksKey = $code->items->pluck('model.uuid')->filter()->toArray();

                if (empty($supportedBooksKey) || ! in_array($validateData['id'], $supportedBooksKey, true)) {
                    return $this->errorResponse(422, 108, "Kode yang anda masukkan tidak cocok untuk buku {$book->title}. Silahkan cek kode yang anda gunakan! [108A]");
                }

                if (! empty($validateData['tier']) && (int) $validateData['tier'] !== $code->tier->value) {
                    return $this->errorResponse(422, 114, 'Kode tidak cocok diaktifkan disini. [114]');
                }

                $user = User::query()
                    ->where('firebase_uid', $validateData['uid'])
                    ->first();

                if ($code->type !== 'public') {
                    if (! empty($code->user_id) && $code->user_id !== $validateData['uid']) {
                        return $this->errorResponse(409, 109, 'Maaf kode yang anda masukkan sudah diaktifkan di akun lain [109]');
                    }

                    if ($code->activate_in !== null && $code->activate_in !== $book->id) {
                        $activatedBook = Book::query()->find($code->activate_in);
                        $activatedBookTitle = $activatedBook?->title ?? 'buku lain';

                        return $this->errorResponse(409, 110, "Maaf kode yang anda masukkan sudah aktif di buku {$activatedBookTitle} [110]");
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

                if($user) {
                    UserBook::query()->updateOrCreate(
                        [
                            'user_id' => $user->id,
                            'book_id' => $book->id,
                        ],
                        [
                            'activation_code_id' => $code->id,
                        ]
                    );
                }


                return $this->successResponse([
                    'message' => $message,
                ]);
            });
        } catch (Exception $except) {
            return $this->errorResponse(500, 500, 'Terjadi kesalahan pada server. '.$except->getMessage());
        }
    }

    #[Endpoint(
        operationId: 'publicBooksActivationLevelV2',
        title: 'Check activation code level v2',
        description: 'Mengembalikan tier atau level dari sebuah kode aktivasi apabila kode tersebut valid pada endpoint versi 2.'
    )]
    #[PathParameter('code', 'Kode aktivasi yang akan dicek levelnya.', example: 'AKTIVASI-001')]
    public function activationCheckLevel(string $code): JsonResponse
    {
        try {
            $activationCode = ActivationCode::query()->where('code', trim($code))->first();

            if (! $activationCode) {
                return $this->errorResponse(404, 106, 'Kode aktivasi tidak valid.');
            }

            return $this->successResponse([
                'level' => [
                    'slug' => $activationCode->tier->value,
                    'name' => $activationCode->tier->label(),
                ],
            ]);
        } catch (Exception $except) {
            return $this->errorResponse(500, 500, 'Terjadi kesalahan pada server. '.$except->getMessage());
        }
    }

    private function successResponse(array $data, int $statusCode = 200): JsonResponse
    {
        return response()->json([
            'status' => true,
            ...$data,
            'version' => 2,
        ], $statusCode);
    }

    private function errorResponse(int $statusCode, int $errorCode, string $message): JsonResponse
    {
        return response()->json([
            'status' => false,
            'errorCode' => $errorCode,
            'message' => $message,
            'version' => 2,
        ], $statusCode);
    }
}

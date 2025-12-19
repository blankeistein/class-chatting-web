<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\BookResource;
use App\Models\ActivationCode;
use App\Models\Book;
use Illuminate\Http\Request;

class BookController extends Controller
{
    private $tester = ['nvRVUlsMQ9Q3se6gJbvCIsGG5k53', '3Psyf8Gb2iOIMXjzv1C7dqculQz2', 'DPdbFiuzk3NkCQn9X36l4k5bnLu2', 'zTctHzi7N4hdD0g7BjXIEONpbud2', 'voijgBsUiDeFxOW2p2KqMlxxbL32', 'cKoJY2E3nLNzYv023XIIdq4cTs23', 'ArxTzz5LfldwSu0MC7aW5Ce6njr2', 'gPq2Gu33cZSajWlHbZFAz82LXNz2', 'Yzy9GJTyoUgqXHms4zxNzz3auGM2', 'buE1H0Fc31UR54oO94HzQQM7Rzo2', 'dMhQmdphV0fGFG0BNhSE2twfrCk2', 'IlVd8Ci2QPQUmT4aYXrhOH1VGj72'];

    public function index()
    {
        $books = Book::all();

        return BookResource::collection($books);
    }

    public function activate(Request $request)
    {
        $validateData = $request->validate([
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

        if ($validateData['code'] === 'lestariilmu') {
            if (in_array($validateData['api_key'], $this->tester)) {
                return response()->json([
                    'status' => 'success',
                    'error_code' => 200,
                    'message' => '[Anda adalah seorang Tester] Kode berhasil diaktifkan.',
                ]);
            } else {
                return response()->json([
                    'status' => 'error',
                    'error_code' => 999,
                    'message' => '[999] Anda tidak tergabung dengan team pengembang. Kode tidak bisa diaktivasi',
                ]);
            }
        }

        if ($validateData['api_key'] !== env('APP_API_KEY')) {
            return response()->json([
                'status' => 'error',
                'error_code' => 102,
                'message' => 'Mohon maaf aplikasi anda sudah usang, update aplikasi ke versi paling baru. [102]',
            ]);
        }

        $code = ActivationCode::where('code', $validateData['code'])->first();

        if (! $code) {
            return response()->json([
                'status' => 'error',
                'error_code' => 106,
                'message' => 'Kode yang anda masukkan tidak valid. [106]',
            ]);
        }

        if ($code->max_activated !== null && $code->times_activated >= $code->max_activated) {
            return response()->json([
                'status' => 'error',
                'error_code' => 113,
                'message' => 'Mohon maaf, Kode sudah mencapai batas pengaktifan. [113]',
            ]);
        }

        $book = Book::where('uuid', $validateData['package_name'])->first();

        if (! $book) {
            return response()->json([
                'status' => 'error',
                'error_code' => 107,
                'message' => 'Buku belum terdaftar, Mohon laporkan ini ke Customer Service kami. Terima Kasih :) [107]',
            ]);
        }

        $supportedBooks = $code->items;

        // Belum selesai
    }
}

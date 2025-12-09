<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Log;

class BookController extends Controller
{
    public function index()
    {
        // Dasar Penggunaan
        Log::channel('activation')->warning("ATTEMPT FAILED | Code: {$code} not found.", [
            'user_id' => $userId,
            'ip_address' => $request->ip(),
        ]);

        Log::channel('activation')->info("SUCCESS | Code: {$code} activated.", [
            'user_id' => $userId,
            'activated_book' => $activationCode->activated_book_id,
        ]);

        return view('admin.book.index');
    }
}

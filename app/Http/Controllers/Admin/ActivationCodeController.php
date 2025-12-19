<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ActivationCodeTierEnum;
use App\Http\Controllers\Controller;
use App\Http\Resources\ActivationCodeResource;
use App\Models\ActivationCode;
use App\Models\Book;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Enum;
use Inertia\Inertia;

class ActivationCodeController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 25);
        $search = $request->input('search');
        $sortBy = $request->input('sort_by', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');
        $bookId = $request->input('book_id');

        $activationCodes = ActivationCode::query()
            ->with(['user', 'items.model'])
            ->when($search, function ($query, $search) {
                $query->where('code', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($query) use ($search) {
                        $query->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            })
            ->when($bookId, function ($query, $bookId) {
                $query->whereHas('items', function ($query) use ($bookId) {
                    $query->where('model_id', $bookId)
                        ->where('model_type', Book::class);
                });
            })
            ->when(in_array($sortBy, ['code', 'created_at', 'updated_at', 'times_activated', 'max_activated']), function ($query) use ($sortBy, $sortDirection) {
                $query->orderBy($sortBy, $sortDirection === 'asc' ? 'asc' : 'desc');
            }, function ($query) {
                $query->latest();
            })
            ->paginate($perPage)
            ->withQueryString();

        $selectedBookData = $bookId ? Book::find($bookId, ['id', 'title']) : null;

        return Inertia::render('Admin/KodeAktivasi/Index', [
            'activationCodes' => ActivationCodeResource::collection($activationCodes),
            'books' => Book::latest()->limit(20)->get(['id', 'title']),
            'selectedBookData' => $selectedBookData,
            'filters' => $request->only(['search', 'per_page', 'sort_by', 'sort_direction', 'book_id']),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'tier' => ['required', new Enum(ActivationCodeTierEnum::class)],
            'quantity' => 'required|integer|min:1|max:1000',
            'mode' => 'required|in:random,custom',
            'type' => 'required|in:single,public',
            'max_activated' => 'nullable|integer|min:1',
            'code_length' => 'required_if:mode,random|nullable|integer|min:4|max:64',
            'custom_code' => 'required_if:mode,custom|nullable|string|unique:activation_codes,code',
            'book_ids' => 'required|array|min:1',
            'book_ids.*' => 'exists:books,id',
        ], [
            'custom_code.unique' => 'Kode ini sudah digunakan, silakan gunakan kode lain.',
            'book_ids.required' => 'Wajib memilih minimal satu buku.',
        ]);

        $quantity = $request->mode === 'custom' ? 1 : $request->quantity;

        DB::transaction(function () use ($request, $quantity) {
            for ($i = 0; $i < $quantity; $i++) {
                if ($request->mode === 'custom') {
                    $codeStr = $request->custom_code;
                } else {
                    $codeStr = $this->generateUniqueCode($request->code_length);
                }

                $activationCode = ActivationCode::create([
                    'code' => $codeStr,
                    'tier' => $request->tier,
                    'max_activated' => $request->max_activated,
                    'type' => $request->type,
                ]);

                foreach ($request->book_ids as $bookId) {
                    $activationCode->items()->create([
                        'model_id' => $bookId,
                        'model_type' => Book::class,
                    ]);
                }
            }
        });

        return redirect()->back()->with('success', "Berhasil membuat {$quantity} kode aktivasi.");
    }

    private function generateUniqueCode($length)
    {
        do {
            $code = strtoupper(Str::random($length));
        } while (ActivationCode::where('code', $code)->exists());

        return $code;
    }

    public function destroy($id)
    {
        $activationCode = ActivationCode::findOrFail($id);
        $activationCode->delete();

        return redirect()->back()->with('success', 'Kode aktivasi berhasil dihapus.');
    }
}

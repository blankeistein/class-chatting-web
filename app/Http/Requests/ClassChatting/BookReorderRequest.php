<?php

namespace App\Http\Requests\ClassChatting;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class BookReorderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'books' => ['required', 'array', 'min:1'],
            'books.*.originalKey' => ['required', 'string', 'max:255'],
            'books.*.order' => ['required', 'integer', 'min:1'],
        ];
    }

    public function messages(): array
    {
        return [
            'books.required' => 'Daftar buku wajib dikirim.',
            'books.array' => 'Daftar buku harus berupa array.',
            'books.*.originalKey.required' => 'Key buku wajib diisi.',
            'books.*.order.required' => 'Urutan buku wajib diisi.',
        ];
    }
}

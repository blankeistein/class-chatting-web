<?php

namespace App\Http\Requests\AnakIndonesiaMenghafal;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class BookStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'uuid' => ['required', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'cover' => ['nullable', 'string', 'max:2048'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:100'],
            'downloadLink' => ['nullable', 'string', 'max:2048'],
            'version' => ['nullable', 'integer', 'min:1'],
            'order' => ['required', 'integer', 'min:1'],
        ];
    }

    public function messages(): array
    {
        return [
            'uuid.required' => 'UUID buku wajib diisi.',
            'title.required' => 'Judul buku wajib diisi.',
            'order.required' => 'Urutan buku wajib diisi.',
            'order.integer' => 'Urutan buku harus berupa angka.',
            'order.min' => 'Urutan buku minimal 1.',
        ];
    }
}

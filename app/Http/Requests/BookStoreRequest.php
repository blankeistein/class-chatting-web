<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BookStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'uuid' => ['nullable', 'string', 'max:255', 'unique:books,uuid'],
            'type' => ['required', 'string', Rule::in(['materi', 'penilaian'])],
            'cover_url' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,svg,webp', 'max:2048'],
            'tags' => ['nullable', 'array'],
            'url' => ['nullable', 'url'],
            'version' => ['nullable', 'integer'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Judul buku wajib diisi.',
            'uuid.unique' => 'UID buku sudah digunakan.',
            'type.required' => 'Tipe buku wajib dipilih.',
            'type.in' => 'Tipe buku tidak valid.',
            'cover_url.image' => 'Cover buku harus berupa gambar.',
            'cover_url.mimes' => 'Format cover buku tidak didukung.',
            'cover_url.max' => 'Ukuran cover buku maksimal 2MB.',
            'url.url' => 'Download link harus berupa URL yang valid.',
            'version.integer' => 'Versi harus berupa angka.',
        ];
    }
}

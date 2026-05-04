<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BookUploadFileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'book_file' => ['nullable', 'file', 'mimes:zip', 'max:51200'],
            'url' => ['nullable', 'url'],
            'version' => ['nullable', 'integer'],
        ];
    }

    public function messages(): array
    {
        return [
            'book_file.file' => 'File buku tidak valid.',
            'book_file.mimes' => 'Format file buku harus PDF atau EPUB.',
            'book_file.max' => 'Ukuran file buku maksimal 50MB.',
            'url.url' => 'Download link harus berupa URL yang valid.',
            'version.integer' => 'Versi harus berupa angka.',
        ];
    }
}

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
            'url' => ['nullable', 'url'],
            'version' => ['nullable', 'integer'],
        ];
    }

    public function messages(): array
    {
        return [
            'url.url' => 'Download link harus berupa URL yang valid.',
            'version.integer' => 'Versi harus berupa angka.',
        ];
    }
}

<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class UpdateVideoHlsUrlRequest extends FormRequest
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
            'slug' => ['required', 'string', 'max:255'],
            'video_url' => [
                'required',
                'url',
                'max:2048',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'slug.required' => 'Slug video wajib diisi.',
            'slug.string' => 'Slug video harus berupa teks.',
            'slug.max' => 'Slug video maksimal 255 karakter.',
            'video_url.required' => 'URL video HLS wajib diisi.',
            'video_url.url' => 'URL video HLS harus berupa URL yang valid.',
            'video_url.max' => 'URL video HLS maksimal 2048 karakter.',
        ];
    }
}

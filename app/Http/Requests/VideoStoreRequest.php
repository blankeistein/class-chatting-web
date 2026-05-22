<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class VideoStoreRequest extends FormRequest
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
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'provider' => 'required|string|in:file,youtube',
            'yt_url' => [
                'required_if:provider,youtube',
                'nullable',
                'string',
                'max:2048',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (! is_string($value) || ! $this->isValidYoutubeReference($value)) {
                        $fail('URL Youtube harus berupa link Youtube yang valid atau ID video 11 karakter.');
                    }
                },
            ],
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Judul wajib diisi.',
            'title.string' => 'Judul harus berupa teks.',
            'title.max' => 'Judul maksimal 255 karakter.',
            'provider.required' => 'Sumber video wajib dipilih.',
            'provider.in' => 'Sumber video tidak valid.',
            'yt_url.required_if' => 'URL Youtube wajib diisi.',
            'yt_url.string' => 'URL Youtube harus berupa teks.',
            'yt_url.max' => 'URL Youtube maksimal 2048 karakter.',
        ];
    }

    private function isValidYoutubeReference(string $value): bool
    {
        $trimmedValue = trim($value);

        if (preg_match('/^[a-zA-Z0-9_-]{11}$/', $trimmedValue) === 1) {
            return true;
        }

        if (! filter_var($trimmedValue, FILTER_VALIDATE_URL)) {
            return false;
        }

        $host = (string) parse_url($trimmedValue, PHP_URL_HOST);

        return str_contains($host, 'youtube.com') || str_contains($host, 'youtu.be');
    }
}

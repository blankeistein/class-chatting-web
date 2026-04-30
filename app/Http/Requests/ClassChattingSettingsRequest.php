<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ClassChattingSettingsRequest extends FormRequest
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
            'announcement' => ['nullable', 'string'],
            'noRekening' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'announcement.string' => 'Pengumuman harus berupa teks.',
            'noRekening.string' => 'Nomor rekening harus berupa teks.',
            'noRekening.max' => 'Nomor rekening maksimal 255 karakter.',
        ];
    }
}

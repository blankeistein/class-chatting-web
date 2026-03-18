<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class RegionListRequest extends FormRequest
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
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'between:1,100'],
        ];
    }

    public function messages(): array
    {
        return [
            'search.string' => 'Parameter pencarian harus berupa teks.',
            'search.max' => 'Parameter pencarian maksimal 100 karakter.',
            'per_page.integer' => 'Parameter per_page harus berupa angka.',
            'per_page.between' => 'Parameter per_page harus berada di antara 1 sampai 100.',
        ];
    }

    public function searchTerm(): ?string
    {
        $search = trim((string) $this->input('search', ''));

        return $search === '' ? null : $search;
    }

    public function perPage(): int
    {
        return (int) $this->input('per_page', 25);
    }
}

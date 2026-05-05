<?php

namespace App\Http\Requests\ClassChattingLayarLebar;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class BookUpdateRequest extends FormRequest
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
            'cover' => ['nullable', 'string', 'max:2048'],
            'id' => ['required', 'string', 'max:255'],
            'bookPath' => ['required', 'string', 'max:255'],
            'playstoreId' => ['nullable', 'string', 'max:255'],
            'keyword' => ['nullable', 'array'],
            'keyword.*' => ['string', 'max:100'],
            'lock' => ['required', 'boolean'],
            'name' => ['required', 'string', 'max:255'],
            'order' => ['required', 'integer', 'min:1'],
            'price' => ['required', 'numeric', 'min:0'],
            'status' => ['required', 'string', 'in:publish,draft'],
            'downloadLink' => ['nullable', 'string', 'max:2048'],
            'version' => ['required', 'integer', 'min:1'],
        ];
    }

    public function messages(): array
    {
        return [
            'id.required' => 'ID buku wajib diisi.',
            'bookPath.required' => 'ID path buku wajib diisi.',
            'name.required' => 'Judul buku wajib diisi.',
            'order.required' => 'Urutan buku wajib diisi.',
            'price.required' => 'Harga buku wajib diisi.',
            'status.in' => 'Status buku tidak valid.',
            'version.required' => 'Versi buku wajib diisi.',
        ];
    }
}

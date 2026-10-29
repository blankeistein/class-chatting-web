<?php

namespace App\Http\Requests\ClassChatting;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class BookBulkActionRequest extends FormRequest
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
            'action' => ['required', 'string', 'in:delete,status,lock'],
            'keys' => ['required', 'array', 'min:1'],
            'keys.*' => ['required', 'string', 'max:255'],
            'status' => ['required_if:action,status', 'nullable', 'string', 'in:publish,draft'],
            'lock' => ['required_if:action,lock', 'nullable', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'action.required' => 'Aksi bulk wajib ditentukan.',
            'action.in' => 'Aksi bulk tidak valid.',
            'keys.required' => 'Pilih minimal satu buku.',
            'keys.min' => 'Pilih minimal satu buku.',
            'status.required_if' => 'Status buku wajib dipilih.',
            'status.in' => 'Status hanya boleh publish atau draft.',
            'lock.required_if' => 'Status kunci buku wajib dipilih.',
        ];
    }
}

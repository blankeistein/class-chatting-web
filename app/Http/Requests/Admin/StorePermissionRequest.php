<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class StorePermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('manageSettings') || $this->user()?->can('permissions.create');
    }

    protected function failedAuthorization(): void
    {
        throw ValidationException::withMessages([
            'authorization' => 'Kamu tidak punya hak untuk menambahkan permission.',
        ]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('permissions', 'name')->where('guard_name', 'web'),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama permission wajib diisi.',
            'name.unique' => 'Nama permission sudah ada.',
        ];
    }
}

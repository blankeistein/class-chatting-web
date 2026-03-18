<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProvinceDataRequest extends FormRequest
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
        $provinceId = $this->route('province')?->id;

        return [
            'code' => ['required', 'string', 'max:10', Rule::unique('provinces', 'code')->ignore($provinceId)],
            'name' => ['required', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'code.required' => 'Kode provinsi wajib diisi.',
            'code.max' => 'Kode provinsi maksimal 10 karakter.',
            'code.unique' => 'Kode provinsi sudah digunakan.',
            'name.required' => 'Nama provinsi wajib diisi.',
            'name.max' => 'Nama provinsi maksimal 255 karakter.',
        ];
    }
}

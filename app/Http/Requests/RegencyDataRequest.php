<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegencyDataRequest extends FormRequest
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
        $regencyId = $this->route('regency')?->id;

        return [
            'province_id' => ['required', 'integer', 'exists:provinces,id'],
            'code' => ['required', 'string', 'max:10', Rule::unique('regencies', 'code')->ignore($regencyId)],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['nullable', 'string', Rule::in(['kabupaten', 'kota'])],
        ];
    }

    public function messages(): array
    {
        return [
            'province_id.required' => 'Provinsi induk wajib dipilih.',
            'province_id.exists' => 'Provinsi induk tidak valid.',
            'code.required' => 'Kode kabupaten atau kota wajib diisi.',
            'code.max' => 'Kode kabupaten atau kota maksimal 10 karakter.',
            'code.unique' => 'Kode kabupaten atau kota sudah digunakan.',
            'name.required' => 'Nama kabupaten atau kota wajib diisi.',
            'name.max' => 'Nama kabupaten atau kota maksimal 255 karakter.',
            'type.in' => 'Tipe daerah harus kabupaten atau kota.',
        ];
    }
}

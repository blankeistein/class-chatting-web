<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DistrictDataRequest extends FormRequest
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
        $districtId = $this->route('district')?->id;

        return [
            'regency_id' => ['required', 'integer', 'exists:regencies,id'],
            'code' => ['required', 'string', 'max:10', Rule::unique('districts', 'code')->ignore($districtId)],
            'name' => ['required', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'regency_id.required' => 'Kabupaten atau kota induk wajib dipilih.',
            'regency_id.exists' => 'Kabupaten atau kota induk tidak valid.',
            'code.required' => 'Kode kecamatan wajib diisi.',
            'code.max' => 'Kode kecamatan maksimal 10 karakter.',
            'code.unique' => 'Kode kecamatan sudah digunakan.',
            'name.required' => 'Nama kecamatan wajib diisi.',
            'name.max' => 'Nama kecamatan maksimal 255 karakter.',
        ];
    }
}

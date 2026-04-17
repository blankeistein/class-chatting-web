<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class VillageDataRequest extends FormRequest
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
        $villageId = $this->route('village')?->id;

        return [
            'district_id' => ['required', 'integer', 'exists:districts,id'],
            'code' => ['required', 'string', 'max:10', Rule::unique('villages', 'code')->ignore($villageId)],
            'name' => ['required', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'district_id.required' => 'Kecamatan induk wajib dipilih.',
            'district_id.exists' => 'Kecamatan induk tidak valid.',
            'code.required' => 'Kode desa wajib diisi.',
            'code.max' => 'Kode desa maksimal 10 karakter.',
            'code.unique' => 'Kode desa sudah digunakan.',
            'name.required' => 'Nama desa wajib diisi.',
            'name.max' => 'Nama desa maksimal 255 karakter.',
        ];
    }
}

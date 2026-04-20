<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SchoolDataRequest extends FormRequest
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
        $schoolId = $this->route('school')?->id;

        return [
            'npsn' => ['nullable', 'string', 'max:20', Rule::unique('schools', 'npsn')->ignore($schoolId)],
            'name' => ['required', 'string', 'max:255'],
            'bentuk_pendidikan' => ['required', 'string', 'max:100'],
            'status' => ['required', 'string', Rule::in(['SWASTA', 'NEGERI'])],
            'province_id' => ['required', 'integer', 'exists:provinces,id'],
            'regency_id' => ['required', 'integer', 'exists:regencies,id'],
            'district_id' => ['required', 'integer', 'exists:districts,id'],
            'address' => ['nullable', 'string'],
            'rt' => ['nullable', 'integer', 'min:0'],
            'rw' => ['nullable', 'integer', 'min:0'],
            'latitute' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
        ];
    }

    public function messages(): array
    {
        return [
            'npsn.max' => 'NPSN maksimal 20 karakter.',
            'npsn.unique' => 'NPSN sudah digunakan.',
            'name.required' => 'Nama sekolah wajib diisi.',
            'name.max' => 'Nama sekolah maksimal 255 karakter.',
            'bentuk_pendidikan.required' => 'Bentuk pendidikan wajib diisi.',
            'bentuk_pendidikan.max' => 'Bentuk pendidikan maksimal 100 karakter.',
            'status.required' => 'Status sekolah wajib diisi.',
            'status.in' => 'Status sekolah harus SWASTA atau NEGERI.',
            'province_id.required' => 'Provinsi wajib dipilih.',
            'province_id.exists' => 'Provinsi tidak valid.',
            'regency_id.required' => 'Kabupaten atau kota wajib dipilih.',
            'regency_id.exists' => 'Kabupaten atau kota tidak valid.',
            'district_id.required' => 'Kecamatan wajib dipilih.',
            'district_id.exists' => 'Kecamatan tidak valid.',
            'rt.integer' => 'RT harus berupa angka.',
            'rt.min' => 'RT tidak boleh kurang dari 0.',
            'rw.integer' => 'RW harus berupa angka.',
            'rw.min' => 'RW tidak boleh kurang dari 0.',
            'latitute.numeric' => 'Latitude harus berupa angka desimal.',
            'latitute.between' => 'Latitude harus berada di antara -90 sampai 90.',
            'longitude.numeric' => 'Longitude harus berupa angka desimal.',
            'longitude.between' => 'Longitude harus berada di antara -180 sampai 180.',
        ];
    }
}

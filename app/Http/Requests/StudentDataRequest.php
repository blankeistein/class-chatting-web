<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StudentDataRequest extends FormRequest
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
        $studentId = $this->route('student')?->id;
        $schoolId = $this->input('school_id');

        return [
            'user_id' => [
                'required',
                'integer',
                'exists:users,id',
                Rule::unique('students', 'user_id')->ignore($studentId),
            ],
            'school_id' => ['required', 'integer', 'exists:schools,id'],
            'nis' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('students', 'nis')
                    ->where(fn ($query) => $query->where('school_id', $schoolId))
                    ->ignore($studentId),
            ],
            'nisn' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('students', 'nisn')->ignore($studentId),
            ],
            'class_name' => ['nullable', 'string', 'max:100'],
            'gender' => ['nullable', 'string', Rule::in(['L', 'P'])],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'user_id.required' => 'Akun user wajib dipilih.',
            'user_id.exists' => 'Akun user tidak valid.',
            'user_id.unique' => 'User ini sudah terdaftar sebagai murid.',
            'school_id.required' => 'Sekolah wajib dipilih.',
            'school_id.exists' => 'Sekolah tidak valid.',
            'nis.max' => 'NIS maksimal 50 karakter.',
            'nis.unique' => 'NIS sudah digunakan di sekolah ini.',
            'nisn.max' => 'NISN maksimal 50 karakter.',
            'nisn.unique' => 'NISN sudah digunakan.',
            'class_name.max' => 'Nama kelas maksimal 100 karakter.',
            'gender.in' => 'Jenis kelamin harus L atau P.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $payload = [];

        if ($this->has('is_active') && is_string($this->is_active)) {
            $payload['is_active'] = filter_var($this->is_active, FILTER_VALIDATE_BOOLEAN);
        }

        foreach (['nis', 'nisn', 'class_name'] as $field) {
            if ($this->has($field) && is_string($this->input($field)) && trim($this->input($field)) === '') {
                $payload[$field] = null;
            }
        }

        if ($payload !== []) {
            $this->merge($payload);
        }
    }
}

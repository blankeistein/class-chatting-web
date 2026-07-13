<?php

namespace App\Http\Requests\API\V2;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
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
        $userId = $this->authenticatedUser()?->id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($userId)],
            'username' => ['nullable', 'string', 'max:255', Rule::unique('users', 'username')->ignore($userId)],
            'phone' => ['nullable', 'string', 'max:20', Rule::unique('users', 'phone')->ignore($userId)],
            'avatar' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remove_avatar' => ['nullable', 'boolean'],
            'schoolId' => ['nullable', 'integer', 'exists:schools,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama lengkap wajib diisi.',
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email sudah terdaftar.',
            'username.unique' => 'Username sudah digunakan.',
            'phone.unique' => 'Nomor telepon sudah digunakan.',
            'avatar.image' => 'File harus berupa gambar.',
            'avatar.mimes' => 'Format gambar harus jpg, jpeg, png, atau webp.',
            'avatar.max' => 'Ukuran gambar maksimal 2MB.',
            'schoolId.integer' => 'schoolId harus berupa angka.',
            'schoolId.exists' => 'Sekolah tidak ditemukan.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('remove_avatar') && is_string($this->remove_avatar)) {
            $this->merge([
                'remove_avatar' => filter_var($this->remove_avatar, FILTER_VALIDATE_BOOLEAN),
            ]);
        }

        if ($this->has('school_id') && ! $this->has('schoolId')) {
            $this->merge([
                'schoolId' => $this->input('school_id'),
            ]);
        }
    }

    public function authenticatedUser(): ?User
    {
        $firebaseUid = $this->attributes->get('firebase_uid');

        if (! is_string($firebaseUid) || $firebaseUid === '') {
            return null;
        }

        return User::query()
            ->where('firebase_uid', $firebaseUid)
            ->where('is_active', true)
            ->first();
    }
}

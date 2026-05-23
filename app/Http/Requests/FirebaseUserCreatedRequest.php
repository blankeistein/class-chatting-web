<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class FirebaseUserCreatedRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * Only the Firebase webhook service is allowed.
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
            'uuid' => ['required', 'string'],
            'email' => ['required_unless:providerType,anonymous', 'nullable', 'email'],
            'displayName' => ['nullable', 'string'],
            'photoURL' => ['nullable', 'url'],
            'phoneNumber' => ['nullable', 'string'],
            'providerType' => ['nullable', 'string'],
            'emailVerified' => ['nullable', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'uuid.required' => 'Firebase UUID wajib diisi.',
            'uuid.string' => 'Firebase UUID harus berupa teks.',
            'email.required_unless' => 'Email wajib diisi kecuali providerType anonymous.',
            'email.email' => 'Email harus berupa alamat email yang valid.',
            'photoURL.url' => 'Photo URL harus berupa URL yang valid.',
        ];
    }
}

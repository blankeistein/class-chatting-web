<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ForgotPasswordRequest extends FormRequest
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
        $rules = [
            'email' => ['required', 'email', 'max:255'],
        ];

        if (config('services.nocaptcha.sitekey')) {
            $rules['g-recaptcha-response'] = 'required|captcha';
        }

        return $rules;
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Email harus berupa alamat email yang valid.',
            'email.max' => 'Email maksimal 255 karakter.',
            'g-recaptcha-response.required' => 'Mohon verifikasi bahwa kamu bukan robot.',
            'g-recaptcha-response.captcha' => 'Captcha error! Coba lagi nanti atau hubungi admin.',
        ];
    }
}

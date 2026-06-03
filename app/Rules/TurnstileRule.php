<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Http;

class TurnstileRule implements ValidationRule
{
    /**
     * Run the validation rule.
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $secret = config('services.turnstile.secret');

        if (empty($secret)) {
            $fail('Turnstile secret key is not configured.');

            return;
        }

        if (empty($value)) {
            $fail('The Turnstile verification is required.');

            return;
        }

        try {
            $response = Http::asForm()->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                'secret' => $secret,
                'response' => $value,
                'remoteip' => request()->ip(),
            ]);

            $result = $response->json();

            if (! $response->successful() || ! ($result['success'] ?? false)) {
                $fail('The Turnstile verification failed. Please try again.');
            }
        } catch (\Exception $e) {
            $fail('Unable to verify Turnstile. Please try again later.');
        }
    }
}
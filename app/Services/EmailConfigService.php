<?php

namespace App\Services;

use App\Mail\TestEmailMailable;
use Illuminate\Support\Facades\Mail;

class EmailConfigService
{
    /**
     * Mengambil konfigurasi email aktif dengan password di-mask.
     *
     * @return array{mailer: string, config: array<string, mixed>, from: array{address: string|null, name: string|null}}
     */
    public function getActiveConfig(): array
    {
        $mailer = config('mail.default');
        $mailerConfig = config("mail.mailers.{$mailer}", []);

        return [
            'mailer' => $mailer,
            'config' => $this->getMailerSpecificConfig($mailer, $mailerConfig),
            'from' => [
                'address' => $this->normalizeValue(config('mail.from.address')),
                'name' => $this->normalizeValue(config('mail.from.name')),
            ],
        ];
    }

    /**
     * Mendapatkan konfigurasi spesifik berdasarkan tipe mailer.
     *
     * @return array<string, mixed>
     */
    private function getMailerSpecificConfig(string $mailer, array $mailerConfig): array
    {
        return match ($mailer) {
            'smtp' => $this->getSmtpConfig($mailerConfig),
            'ses' => $this->getSesConfig(),
            'postmark' => $this->getPostmarkConfig(),
            'mailgun' => $this->getMailgunConfig(),
            default => $this->getGenericConfig($mailerConfig),
        };
    }

    /**
     * @return array{host: string|null, port: int|null, encryption: string|null, username: string|null, password_status: string}
     */
    private function getSmtpConfig(array $mailerConfig): array
    {
        return [
            'host' => $this->normalizeValue($mailerConfig['host'] ?? null),
            'port' => isset($mailerConfig['port']) && $mailerConfig['port'] !== '' ? (int) $mailerConfig['port'] : null,
            'encryption' => $this->normalizeValue($mailerConfig['scheme'] ?? null),
            'username' => $this->normalizeValue($mailerConfig['username'] ?? null),
            'password_status' => $this->getPasswordStatus($mailerConfig['password'] ?? null),
        ];
    }

    /**
     * @return array{region: string|null}
     */
    private function getSesConfig(): array
    {
        return [
            'region' => $this->normalizeValue(config('services.ses.region')),
        ];
    }

    /**
     * @return array{token_status: string}
     */
    private function getPostmarkConfig(): array
    {
        return [
            'token_status' => $this->getPasswordStatus(config('services.postmark.token')),
        ];
    }

    /**
     * @return array{domain: string|null, endpoint: string|null}
     */
    private function getMailgunConfig(): array
    {
        return [
            'domain' => $this->normalizeValue(config('services.mailgun.domain')),
            'endpoint' => $this->normalizeValue(config('services.mailgun.endpoint')),
        ];
    }

    /**
     * @return array{transport: string}
     */
    private function getGenericConfig(array $mailerConfig): array
    {
        return [
            'transport' => $mailerConfig['transport'] ?? $mailerConfig['driver'] ?? 'unknown',
        ];
    }

    /**
     * Melakukan koneksi ke SMTP server.
     *
     * @return array{status: string, banner: ?string, error: ?string, error_type: ?string, response_time_ms: int}
     */
    public function checkSmtpConnection(): array
    {
        $host = config('mail.mailers.smtp.host');
        $port = config('mail.mailers.smtp.port');

        if (empty($host) || empty($port)) {
            return [
                'status' => 'failed',
                'banner' => null,
                'error' => 'SMTP host and port must be configured',
                'error_type' => 'connection_refused',
                'response_time_ms' => 0,
            ];
        }

        $startTime = microtime(true);

        try {
            $connection = @stream_socket_client(
                "tcp://{$host}:{$port}",
                $errorCode,
                $errorMessage,
                10,
                STREAM_CLIENT_CONNECT
            );

            if ($connection === false) {
                $elapsed = (int) round((microtime(true) - $startTime) * 1000);

                return [
                    'status' => 'failed',
                    'banner' => null,
                    'error' => $errorMessage ?: "Connection failed (code: {$errorCode})",
                    'error_type' => $this->categorizeSmtpError(new \RuntimeException($errorMessage ?: "Connection refused (code: {$errorCode})")),
                    'response_time_ms' => $elapsed,
                ];
            }

            stream_set_timeout($connection, 10);

            $banner = trim((string) fgets($connection, 1024));

            fclose($connection);

            $elapsed = (int) round((microtime(true) - $startTime) * 1000);

            return [
                'status' => 'connected',
                'banner' => $banner ?: null,
                'error' => null,
                'error_type' => null,
                'response_time_ms' => $elapsed,
            ];
        } catch (\Throwable $e) {
            $elapsed = (int) round((microtime(true) - $startTime) * 1000);

            return [
                'status' => 'failed',
                'banner' => null,
                'error' => $e->getMessage(),
                'error_type' => $this->categorizeSmtpError($e),
                'response_time_ms' => $elapsed,
            ];
        }
    }

    /**
     * Mengirim test email.
     *
     * @return array{success: bool, message: string, sent_at: ?string, error_type: ?string}
     */
    public function sendTestEmail(string $recipient): array
    {
        try {
            Mail::to($recipient)->send(new TestEmailMailable);

            return [
                'success' => true,
                'message' => 'Test email sent successfully',
                'sent_at' => now()->format('d M Y H:i:s'),
                'error_type' => null,
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'message' => $e->getMessage(),
                'sent_at' => null,
                'error_type' => $this->categorizeSendError($e),
            ];
        }
    }

    /**
     * Kategorisasi error pengiriman email berdasarkan pesan exception.
     */
    private function categorizeSendError(\Throwable $e): string
    {
        $message = strtolower($e->getMessage());

        return match (true) {
            str_contains($message, 'timeout') || str_contains($message, 'timed out') => 'timeout',
            str_contains($message, 'authentication') || str_contains($message, '535') => 'authentication_failed',
            str_contains($message, 'connection refused') || str_contains($message, '111') => 'connection_refused',
            str_contains($message, 'recipient') || str_contains($message, '550') || str_contains($message, '553') => 'invalid_recipient',
            default => 'connection_refused',
        };
    }

    /**
     * Kategorisasi error SMTP berdasarkan pesan exception.
     */
    private function categorizeSmtpError(\Throwable $e): string
    {
        $message = strtolower($e->getMessage());

        return match (true) {
            str_contains($message, 'timeout') || str_contains($message, 'timed out') => 'timeout',
            str_contains($message, 'authentication') || str_contains($message, '535') => 'authentication_failed',
            str_contains($message, 'connection refused') || str_contains($message, '111') => 'connection_refused',
            str_contains($message, 'getaddrinfo') || str_contains($message, 'resolve') => 'dns_resolution_failed',
            str_contains($message, 'ssl') || str_contains($message, 'tls') => 'tls_ssl_error',
            default => 'connection_refused',
        };
    }

    /**
     * Mask password: return "Configured" if non-empty, "Not Configured" if null/empty.
     */
    private function getPasswordStatus(mixed $value): string
    {
        return filled($value) ? 'Configured' : 'Not Configured';
    }

    /**
     * Return null for any config field that is null or empty string.
     */
    private function normalizeValue(mixed $value): mixed
    {
        if ($value === null || $value === '') {
            return null;
        }

        return $value;
    }
}

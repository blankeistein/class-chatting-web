<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Http\Request;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use JsonException;
use Throwable;

class ExceptionReported extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Throwable $throwable,
        public Request $request,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: sprintf('[%s] Exception: %s', config('app.name'), class_basename($this->throwable)),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.exception-reported',
            with: [
                'report' => $this->buildReport(),
            ],
        );
    }

    /**
     * @return array<string, mixed>
     */
    protected function buildReport(): array
    {
        return [
            'app_name' => config('app.name'),
            'environment' => config('app.env'),
            'occurred_at' => now()->toDateTimeString(),
            'exception_class' => $this->throwable::class,
            'message' => $this->throwable->getMessage(),
            'file' => sprintf('%s:%d', $this->throwable->getFile(), $this->throwable->getLine()),
            'method' => $this->request->method(),
            'url' => $this->request->fullUrl(),
            'ip' => $this->request->ip(),
            'user_agent' => $this->request->userAgent(),
            'user' => $this->formatUser(),
            'input' => $this->formatJson(Arr::except($this->request->all(), [
                'password',
                'password_confirmation',
                'current_password',
                '_token',
                'token',
                'authorization',
            ])),
            'trace' => $this->formatTrace(),
            'log_excerpt' => $this->readLatestLogExcerpt(),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    protected function formatUser(): ?array
    {
        $user = Auth::user();

        if ($user === null) {
            return null;
        }

        return [
            'id' => $user->getAuthIdentifier(),
            'email' => $user->email,
        ];
    }

    protected function formatJson(mixed $value): string
    {
        try {
            return json_encode($value, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR) ?: '[]';
        } catch (JsonException) {
            return 'Unable to encode payload.';
        }
    }

    protected function formatTrace(): string
    {
        $traceLines = preg_split('/\R/', $this->throwable->getTraceAsString()) ?: [];

        return implode(PHP_EOL, array_slice($traceLines, 0, 20));
    }

    protected function readLatestLogExcerpt(): string
    {
        $logFiles = collect(File::glob(storage_path('logs/*.log')))
            ->sortByDesc(static fn (string $path): int => File::lastModified($path))
            ->values();

        $latestLogFile = $logFiles->first();

        if ($latestLogFile === null || ! File::exists($latestLogFile)) {
            return 'No log file found.';
        }

        $content = File::get($latestLogFile);
        $lines = preg_split('/\R/', $content) ?: [];
        $excerpt = implode(PHP_EOL, array_slice($lines, -80));

        return trim($excerpt) !== '' ? $excerpt : 'Log file is empty.';
    }
}

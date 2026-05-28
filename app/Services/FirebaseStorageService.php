<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Kreait\Laravel\Firebase\Facades\Firebase;

class FirebaseStorageService
{
    /**
     * Upload a file to Firebase Storage.
     */
    public function upload(UploadedFile $file, string $path): void
    {
        Firebase::storage()->getBucket()->upload(
            fopen($file->getPathname(), 'r'),
            ['name' => $path]
        );
    }

    /**
     * Upload raw content to Firebase Storage.
     */
    public function uploadContent(string $content, string $path, string $contentType = 'application/octet-stream'): void
    {
        Firebase::storage()->getBucket()->upload($content, [
            'name' => $path,
            'metadata' => [
                'contentType' => $contentType,
            ],
        ]);
    }

    /**
     * Upload an image file to Firebase Storage as compressed WebP.
     *
     * @param  int  $quality  WebP quality (0-100)
     * @param  int|null  $maxSize  Max width/height in pixels, null to skip resizing
     *
     * @throws ValidationException
     */
    public function uploadImageAsWebp(UploadedFile $file, string $path, int $quality = 80, ?int $maxSize = null): void
    {
        if (! function_exists('imagewebp')) {
            throw ValidationException::withMessages([
                'image' => 'Server belum mendukung kompresi gambar ke WebP.',
            ]);
        }

        $image = $this->createImageResource($file->getPathname(), $file->getMimeType());
        $temporaryWebpPath = tempnam(sys_get_temp_dir(), 'firebase-img-');

        if ($temporaryWebpPath === false) {
            imagedestroy($image);

            throw ValidationException::withMessages([
                'image' => 'Gagal menyiapkan file sementara.',
            ]);
        }

        try {
            if ($maxSize) {
                $image = $this->resizeImage($image, $maxSize);
            }

            if (function_exists('imagepalettetotruecolor')) {
                imagepalettetotruecolor($image);
            }

            imagealphablending($image, true);
            imagesavealpha($image, true);

            if (! imagewebp($image, $temporaryWebpPath, $quality)) {
                throw ValidationException::withMessages([
                    'image' => 'Gagal mengompres gambar ke format WebP.',
                ]);
            }

            Firebase::storage()->getBucket()->upload(
                fopen($temporaryWebpPath, 'r'),
                ['name' => $path]
            );
        } finally {
            imagedestroy($image);

            if (is_file($temporaryWebpPath)) {
                unlink($temporaryWebpPath);
            }
        }
    }

    /**
     * Delete an object from Firebase Storage.
     */
    public function delete(?string $path): void
    {
        if (! $path) {
            return;
        }

        try {
            $object = Firebase::storage()->getBucket()->object($path);

            if ($object->exists()) {
                $object->delete();
            }
        } catch (\Exception $e) {
            Log::error('Firebase object deletion failed: '.$e->getMessage());
        }
    }

    /**
     * Build a public Firebase Storage URL from a path.
     */
    public function buildUrl(string $path): string
    {
        $bucketName = config('services.firebase.storage_bucket')
            ?? Firebase::storage()->getBucket()->name();

        return "https://firebasestorage.googleapis.com/v0/b/{$bucketName}/o/".urlencode($path).'?alt=media';
    }

    /**
     * Extract Firebase Storage path from a public URL.
     */
    public function extractPath(?string $url): ?string
    {
        if (! $url) {
            return null;
        }

        if (preg_match('#/o/(.+?)(\?|$)#', $url, $matches)) {
            return urldecode($matches[1]);
        }

        return null;
    }

    /**
     * Create a GD image resource from a file path.
     *
     * @throws ValidationException
     */
    private function createImageResource(string $pathname, ?string $mimeType): \GdImage
    {
        $image = match ($mimeType) {
            'image/jpeg', 'image/jpg' => imagecreatefromjpeg($pathname),
            'image/png' => imagecreatefrompng($pathname),
            'image/gif' => imagecreatefromgif($pathname),
            'image/webp' => function_exists('imagecreatefromwebp') ? imagecreatefromwebp($pathname) : false,
            default => false,
        };

        if (! $image instanceof \GdImage) {
            throw ValidationException::withMessages([
                'image' => 'Format gambar tidak dapat diproses ke WebP.',
            ]);
        }

        return $image;
    }

    /**
     * Resize an image if it exceeds the max size.
     */
    private function resizeImage(\GdImage $source, int $maxSize): \GdImage
    {
        $width = imagesx($source);
        $height = imagesy($source);

        if ($width <= $maxSize && $height <= $maxSize) {
            return $source;
        }

        $ratio = min($maxSize / $width, $maxSize / $height);
        $newWidth = (int) ($width * $ratio);
        $newHeight = (int) ($height * $ratio);

        $resized = imagecreatetruecolor($newWidth, $newHeight);
        imagealphablending($resized, false);
        imagesavealpha($resized, true);
        imagecopyresampled($resized, $source, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
        imagedestroy($source);

        return $resized;
    }
}

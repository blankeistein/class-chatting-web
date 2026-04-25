<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Video;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Kreait\Laravel\Firebase\Facades\Firebase;

class VideoController extends Controller
{
    /**
     * Display a listing of the videos.
     */
    public function index(Request $request): Response
    {
        $query = Video::with('uploader');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhereJsonContains('tags', $search);
            });
        }

        $sort = $request->input('sort', 'latest');
        switch ($sort) {
            case 'oldest':
                $query->oldest();
                break;
            case 'name_asc':
                $query->orderBy('title', 'asc');
                break;
            case 'name_desc':
                $query->orderBy('title', 'desc');
                break;
            case 'latest':
            default:
                $query->latest();
                break;
        }
        $perPage = $request->input('per_page', 25);

        $videos = $query->paginate($perPage)->withQueryString();

        return Inertia::render('Admin/Video/Index', [
            'videos' => $videos,
            'filters' => $request->only(['search', 'sort']),
        ]);
    }

    /**
     * Show the form for creating a new video.
     */
    public function create(): Response
    {
        return Inertia::render('Admin/Video/Create');
    }

    public function jobs(): Response
    {
        return Inertia::render('Admin/Video/Jobs');
    }

    /**
     * Store a newly created video in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'video' => 'required|file|mimetypes:video/mp4,video/quicktime,video/x-msvideo|max:102400',
            'thumbnail' => 'nullable|image|max:5120',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
        ], [
            'title.required' => 'Judul wajib diisi.',
            'title.string' => 'Judul harus berupa teks.',
            'title.max' => 'Judul maksimal 255 karakter.',
            'video.required' => 'File video wajib diunggah.',
            'video.file' => 'File video harus berupa file.',
            'video.mimetypes' => 'Format video harus mp4, mov, atau avi.',
            'video.max' => 'Ukuran video maksimal 100MB.',
            'thumbnail.image' => 'Thumbnail harus berupa gambar.',
            'thumbnail.max' => 'Ukuran thumbnail maksimal 5MB.',
        ]);

        $videoFile = $request->file('video');
        $slug = Str::random(11);
        $storagePath = $this->makeStoragePath($videoFile, $slug);

        $this->uploadFileToFirebase($videoFile, $storagePath);

        $thumbnailUrl = null;
        if ($request->hasFile('thumbnail')) {
            $thumbnailFile = $request->file('thumbnail');
            $thumbnailPath = $this->makeThumbnailPath($slug);
            $temporaryWebpPath = $this->convertImageToWebpTemporaryPath($thumbnailFile, 70);
            $this->uploadLocalFileToFirebase($temporaryWebpPath, $thumbnailPath);
            @unlink($temporaryWebpPath);
            $thumbnailUrl = $this->buildFirebaseUrl($thumbnailPath);
        }

        Video::create([
            'title' => $request->title,
            'slug' => $slug,
            'description' => $request->description,
            'tags' => $request->tags ?? [],
            'uploaded_by' => Auth::id(),
            'video_url' => null,
            'thumbnail' => $thumbnailUrl,
            'storage_path' => $storagePath,
            'provider' => 'firebase',
        ]);

        return redirect()->route('admin.videos.index')->with('success', 'Video berhasil diunggah.');
    }

    /**
     * Display the specified video.
     */
    public function show(Video $video): Response
    {
        $video->load('uploader');

        return Inertia::render('Admin/Video/Show', [
            'video' => $video,
        ]);
    }

    /**
     * Show the form for editing the specified video.
     */
    public function edit(Video $video): Response
    {
        return Inertia::render('Admin/Video/Edit', [
            'video' => $video,
        ]);
    }

    /**
     * Update the specified video in storage.
     */
    public function update(Request $request, Video $video): RedirectResponse
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'video' => 'nullable|file|mimetypes:video/mp4,video/quicktime,video/x-msvideo|max:102400',
            'thumbnail' => 'nullable|image|max:5120',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
        ], [
            'title.required' => 'Judul wajib diisi.',
            'title.string' => 'Judul harus berupa teks.',
            'title.max' => 'Judul maksimal 255 karakter.',
            'video.file' => 'File video harus berupa file.',
            'video.mimetypes' => 'Format video harus mp4, mov, atau avi.',
            'video.max' => 'Ukuran video maksimal 100MB.',
            'thumbnail.image' => 'Thumbnail harus berupa gambar.',
            'thumbnail.max' => 'Ukuran thumbnail maksimal 5MB.',
        ]);

        $updateData = [
            'title' => $request->title,
            'description' => $request->description,
            'tags' => $request->tags ?? [],
        ];

        if ($request->hasFile('video')) {
            $videoFile = $request->file('video');
            $storagePath = $this->makeStoragePath($videoFile, $video->slug);

            $this->uploadFileToFirebase($videoFile, $storagePath);
            $this->deleteFirebaseObject($video->storage_path);
            $this->deleteFirebaseDirectory($this->makeHlsDirectory($video->slug));

            $updateData['video_url'] = null;
            $updateData['storage_path'] = $storagePath;
            $updateData['provider'] = 'firebase';
        }

        if ($request->hasFile('thumbnail')) {
            $thumbnailFile = $request->file('thumbnail');
            $thumbnailPath = $this->makeThumbnailPath($video->slug);
            $temporaryWebpPath = $this->convertImageToWebpTemporaryPath($thumbnailFile, 70);

            $this->uploadLocalFileToFirebase($temporaryWebpPath, $thumbnailPath);
            @unlink($temporaryWebpPath);
            $this->deleteFirebaseObject($this->extractFirebasePath($video->thumbnail));

            $updateData['thumbnail'] = $this->buildFirebaseUrl($thumbnailPath);
        }

        $video->update($updateData);

        return redirect()->route('admin.videos.show', $video)->with('success', 'Video berhasil diperbarui.');
    }

    /**
     * Remove the specified video from storage.
     */
    public function destroy(Video $video): RedirectResponse
    {
        if ($video->provider === 'firebase') {
            $this->deleteFirebaseObject($video->storage_path);
            $this->deleteFirebaseObject($this->extractFirebasePath($video->thumbnail));
            $this->deleteFirebaseDirectory($this->makeHlsDirectory($video->slug));
        }

        $video->delete();

        return redirect()->route('admin.videos.index')->with('success', 'Video berhasil dihapus.');
    }

    private function makeStoragePath(UploadedFile $file, string $slug): string
    {
        $extension = $file->getClientOriginalExtension();
        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $filename = Str::slug($originalName).'-'.uniqid().'.'.$extension;

        return "videos/{$slug}/{$filename}";
    }

    private function makeThumbnailPath(string $slug): string
    {
        return "videos/{$slug}/thumbnail-".uniqid().'.webp';
    }

    private function makeHlsDirectory(string $slug): string
    {
        return "hls/{$slug}/";
    }

    private function uploadFileToFirebase(UploadedFile $file, string $path): void
    {
        Firebase::storage()->getBucket()->upload(
            fopen($file->getPathname(), 'r'),
            ['name' => $path]
        );
    }

    private function uploadLocalFileToFirebase(string $localPath, string $remotePath): void
    {
        Firebase::storage()->getBucket()->upload(
            fopen($localPath, 'r'),
            ['name' => $remotePath]
        );
    }

    private function convertImageToWebpTemporaryPath(UploadedFile $file, int $quality = 70): string
    {
        $source = @imagecreatefromstring(file_get_contents($file->getPathname()));

        if (! $source) {
            throw new \RuntimeException('Thumbnail gagal diproses menjadi WebP.');
        }

        $width = imagesx($source);
        $height = imagesy($source);
        $canvas = imagecreatetruecolor($width, $height);

        imagealphablending($canvas, false);
        imagesavealpha($canvas, true);
        $transparent = imagecolorallocatealpha($canvas, 0, 0, 0, 127);
        imagefilledrectangle($canvas, 0, 0, $width, $height, $transparent);
        imagecopy($canvas, $source, 0, 0, 0, 0, $width, $height);

        $temporaryPath = tempnam(sys_get_temp_dir(), 'thumb-webp-');

        if ($temporaryPath === false) {
            unset($canvas, $source);
            throw new \RuntimeException('File sementara thumbnail tidak dapat dibuat.');
        }

        $webpPath = $temporaryPath.'.webp';
        @unlink($temporaryPath);

        $converted = imagewebp($canvas, $webpPath, $quality);

        unset($canvas, $source);

        if (! $converted) {
            throw new \RuntimeException('Thumbnail gagal dikonversi ke WebP.');
        }

        return $webpPath;
    }

    private function deleteFirebaseObject(?string $path): void
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

    private function deleteFirebaseDirectory(?string $prefix): void
    {
        if (! $prefix) {
            return;
        }

        try {
            $bucket = Firebase::storage()->getBucket();

            foreach ($bucket->objects(['prefix' => $prefix]) as $object) {
                $object->delete();
            }
        } catch (\Exception $e) {
            Log::error('Firebase directory deletion failed: '.$e->getMessage());
        }
    }

    private function buildFirebaseUrl(string $path): string
    {
        $bucketName = env('FIREBASE_STORAGE_BUCKET');

        return "https://firebasestorage.googleapis.com/v0/b/{$bucketName}/o/".urlencode($path).'?alt=media';
    }

    private function extractFirebasePath(?string $url): ?string
    {
        if (! $url) {
            return null;
        }

        $prefix = 'https://firebasestorage.googleapis.com/v0/b/'.env('FIREBASE_STORAGE_BUCKET').'/o/';

        if (! str_contains($url, $prefix)) {
            return null;
        }

        return urldecode(explode('?', str_replace($prefix, '', $url))[0]);
    }
}

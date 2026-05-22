<?php

namespace App\Http\Controllers\Admin;

use App\Enums\VideoProviderEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\VideoStoreRequest;
use App\Http\Requests\VideoUpdateRequest;
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

        $provider = VideoProviderEnum::tryFrom((string) $request->input('provider'));

        if ($provider) {
            $query->where('provider', $provider->value);
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
            'filters' => $request->only(['search', 'sort', 'provider']),
            'videoProviders' => VideoProviderEnum::labels(),
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
    public function store(VideoStoreRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $slug = Str::random(11);

        $videoData = [
            'title' => $validated['title'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'tags' => $validated['tags'] ?? [],
            'uploaded_by' => Auth::id(),
            'video_url' => null,
            'thumbnail' => null,
            'storage_path' => null,
            'provider' => VideoProviderEnum::Firebase,
        ];

        if ($validated['provider'] === 'youtube') {
            $videoData['video_url'] = trim($validated['yt_url']);
            $videoData['provider'] = VideoProviderEnum::Youtube;
        }

        $video = Video::create($videoData);

        return redirect()->route('admin.videos.edit', $video)
            ->with('success', 'Video berhasil dibuat. Silakan upload file video dan thumbnail.');
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
    public function update(VideoUpdateRequest $request, Video $video): RedirectResponse
    {
        $validated = $request->validated();

        $video->update([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'tags' => $validated['tags'] ?? [],
        ]);

        return redirect()->route('admin.videos.edit', $video)->with('success', 'Informasi video berhasil diperbarui.');
    }

    /**
     * Upload or replace the video file for an existing video.
     */
    public function uploadVideo(Request $request, Video $video): RedirectResponse
    {
        $request->validate([
            'provider' => 'required|string|in:file,youtube',
            'video' => 'required_if:provider,file|nullable|file|mimetypes:video/mp4,video/quicktime,video/x-msvideo|max:102400',
            'yt_url' => [
                'required_if:provider,youtube',
                'nullable',
                'string',
                'max:2048',
            ],
        ], [
            'video.required_if' => 'File video wajib diunggah.',
            'video.mimetypes' => 'Format video harus mp4, mov, atau avi.',
            'video.max' => 'Ukuran video maksimal 100MB.',
            'yt_url.required_if' => 'URL Youtube wajib diisi.',
        ]);

        if ($request->input('provider') === 'youtube') {
            if ($video->provider === VideoProviderEnum::Firebase) {
                $this->deleteFirebaseObject($video->storage_path);
                $this->deleteFirebaseDirectory($this->makeHlsDirectory($video->slug));
            }

            $video->update([
                'video_url' => trim($request->input('yt_url')),
                'storage_path' => null,
                'provider' => VideoProviderEnum::Youtube,
            ]);

            return redirect()->back()->with('success', 'URL Youtube berhasil disimpan.');
        }

        if ($request->hasFile('video')) {
            $videoFile = $request->file('video');
            $storagePath = $this->makeStoragePath($videoFile, $video->slug);

            $this->uploadFileToFirebase($videoFile, $storagePath);

            if ($video->provider === VideoProviderEnum::Firebase) {
                $this->deleteFirebaseObject($video->storage_path);
                $this->deleteFirebaseDirectory($this->makeHlsDirectory($video->slug));
            }

            $video->update([
                'video_url' => null,
                'storage_path' => $storagePath,
                'provider' => VideoProviderEnum::Firebase,
            ]);

            return redirect()->back()->with('success', 'Video berhasil diupload.');
        }

        return redirect()->back()->with('error', 'Tidak ada file video yang dikirim.');
    }

    /**
     * Upload or replace the thumbnail for an existing video.
     */
    public function uploadThumbnail(Request $request, Video $video): RedirectResponse
    {
        $request->validate([
            'thumbnail' => 'required|image|max:5120',
        ], [
            'thumbnail.required' => 'File thumbnail wajib diunggah.',
            'thumbnail.image' => 'Thumbnail harus berupa gambar.',
            'thumbnail.max' => 'Ukuran thumbnail maksimal 5MB.',
        ]);

        $thumbnailFile = $request->file('thumbnail');
        $thumbnailPath = $this->makeThumbnailPath($video->slug);
        $temporaryWebpPath = $this->convertImageToWebpTemporaryPath($thumbnailFile, 70);

        $this->uploadLocalFileToFirebase($temporaryWebpPath, $thumbnailPath);
        @unlink($temporaryWebpPath);

        $this->deleteFirebaseObject($this->extractFirebasePath($video->thumbnail));

        $video->update([
            'thumbnail' => $this->buildFirebaseUrl($thumbnailPath),
        ]);

        return redirect()->back()->with('success', 'Thumbnail berhasil diperbarui.');
    }

    /**
     * Check HLS manifest availability and update video_url.
     */
    public function syncHlsUrl(Video $video): RedirectResponse
    {
        if ($video->provider !== VideoProviderEnum::Firebase) {
            return redirect()->back()->with('error', 'Hanya video Firebase yang bisa disinkronkan.');
        }

        $manifestPath = "hls/{$video->slug}/manifest.m3u8";
        $bucket = Firebase::storage()->getBucket();
        $object = $bucket->object($manifestPath);

        if (! $object->exists()) {
            return redirect()->back()->with('error', 'Manifest HLS belum tersedia. Pastikan proses transcoding sudah selesai.');
        }

        $video->update([
            'video_url' => $this->buildFirebaseUrl($manifestPath),
        ]);

        return redirect()->back()->with('success', 'URL video berhasil diperbarui dengan manifest HLS.');
    }

    /**
     * Remove the specified video from storage.
     */
    public function destroy(Video $video): RedirectResponse
    {
        if ($video->provider === VideoProviderEnum::Firebase) {
            $this->deleteFirebaseObject($video->storage_path);
            $this->deleteFirebaseDirectory($this->makeHlsDirectory($video->slug));
        }

        $this->deleteFirebaseObject($this->extractFirebasePath($video->thumbnail));

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
        $bucketName = config('services.firebase.storage_bucket');

        return "https://firebasestorage.googleapis.com/v0/b/{$bucketName}/o/".urlencode($path).'?alt=media';
    }

    private function extractFirebasePath(?string $url): ?string
    {
        if (! $url) {
            return null;
        }

        $prefix = 'https://firebasestorage.googleapis.com/v0/b/'.config('services.firebase.storage_bucket').'/o/';

        if (! str_contains($url, $prefix)) {
            return null;
        }

        return urldecode(explode('?', str_replace($prefix, '', $url))[0]);
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Enums\VideoProviderEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\VideoStoreRequest;
use App\Http\Requests\VideoUpdateRequest;
use App\Models\Video;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Http;
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
        Gate::authorize('update', $video);

        return Inertia::render('Admin/Video/Edit', [
            'video' => $video,
        ]);
    }

    /**
     * Update the specified video in storage.
     */
    public function update(VideoUpdateRequest $request, Video $video): RedirectResponse
    {
        Gate::authorize('update', $video);

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
        Gate::authorize('update', $video);

        $request->validate([
            'provider' => 'required|string|in:file,youtube',
            'storage_path' => 'required_if:provider,file|nullable|string|max:1024',
            'file_size' => 'nullable|integer|min:0',
            'yt_url' => [
                'required_if:provider,youtube',
                'nullable',
                'string',
                'max:2048',
            ],
        ], [
            'storage_path.required_if' => 'Video harus diupload terlebih dahulu.',
            'yt_url.required_if' => 'URL Youtube wajib diisi.',
        ]);

        if ($request->input('provider') === 'youtube') {
            $video->update([
                'video_url' => trim($request->input('yt_url')),
                'storage_path' => null,
                'provider' => VideoProviderEnum::Youtube,
                'metadata' => null,
            ]);

            return redirect()->back()->with('success', 'URL Youtube berhasil disimpan.');
        }

        $storagePath = $request->input('storage_path');

        $video->update([
            'video_url' => null,
            'storage_path' => $storagePath,
            'provider' => VideoProviderEnum::Firebase,
            'metadata' => [
                'file_size' => $request->input('file_size'),
                'uploaded_by' => Auth::user()?->name,
                'uploaded_at' => now()->toISOString(),
            ],
        ]);

        $this->dispatchHlsConversion($video, $storagePath);

        return redirect()->back()->with('success', 'Video berhasil disimpan.');
    }

    /**
     * Upload or replace the thumbnail for an existing video.
     */
    public function uploadThumbnail(Request $request, Video $video): RedirectResponse
    {
        Gate::authorize('update', $video);

        $request->validate([
            'thumbnail_url' => 'required|string|url|max:2048',
        ], [
            'thumbnail_url.required' => 'URL thumbnail wajib diisi.',
            'thumbnail_url.url' => 'URL thumbnail tidak valid.',
        ]);

        $video->update([
            'thumbnail' => $request->input('thumbnail_url'),
        ]);

        return redirect()->back()->with('success', 'Thumbnail berhasil diperbarui.');
    }

    /**
     * Dispatch HLS conversion to the external service.
     */
    private function dispatchHlsConversion(Video $video, string $storagePath): void
    {
        $hlsServiceUrl = config('services.hls.url');

        if (! $hlsServiceUrl) {
            Log::warning('HLS_SERVICE_URL is not configured. Skipping HLS conversion.');

            return;
        }

        try {
            $firebaseAuth = Firebase::auth();
            $customToken = $firebaseAuth->createCustomToken(Auth::user()->firebase_uid);
            $signInResult = $firebaseAuth->signInWithCustomToken($customToken->toString());
            $idToken = $signInResult->idToken();

            $bucket = config('services.firebase.storage_bucket');

            $response = Http::withToken($idToken)
                ->post("{$hlsServiceUrl}/convert", [
                    'sourceUrl' => "gs://{$bucket}/{$storagePath}",
                    'outputBucket' => $bucket,
                    'slug' => $video->slug,
                ]);

            if ($response->failed()) {
                Log::error('HLS conversion request failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'slug' => $video->slug,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('HLS conversion dispatch failed: '.$e->getMessage(), [
                'slug' => $video->slug,
            ]);
        }
    }

    /**
     * Check HLS manifest availability and update video_url.
     */
    public function syncHlsUrl(Video $video): RedirectResponse
    {
        Gate::authorize('update', $video);

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
        Gate::authorize('delete', $video);

        if ($video->provider === VideoProviderEnum::Firebase) {
            $this->deleteFirebaseObject($video->storage_path);
            $this->deleteFirebaseDirectory($this->makeHlsDirectory($video->slug));
        }

        $this->deleteFirebaseObject($this->extractFirebasePath($video->thumbnail));

        $video->delete();

        return redirect()->route('admin.videos.index')->with('success', 'Video berhasil dihapus.');
    }

    private function makeHlsDirectory(string $slug): string
    {
        return "hls/{$slug}/";
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

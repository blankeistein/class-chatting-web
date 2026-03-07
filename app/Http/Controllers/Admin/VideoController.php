<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Video;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Kreait\Laravel\Firebase\Facades\Firebase;

class VideoController extends Controller
{
    /**
     * Display a listing of the videos.
     */
    public function index(Request $request)
    {
        $query = Video::with('uploader');

        // Search by name or tags
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhereJsonContains('tags', $search);
            });
        }

        // Sort
        $sort = $request->get('sort', 'latest');
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

        $videos = $query->paginate(10)->withQueryString();

        return Inertia::render('Admin/Video/Index', [
            'videos' => $videos,
            'filters' => $request->only(['search', 'sort']),
        ]);
    }

    /**
     * Show the form for creating a new video.
     */
    public function create()
    {
        return Inertia::render('Admin/Video/Create');
    }

    /**
     * Store a newly created video in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'video' => 'required|file|mimetypes:video/mp4,video/quicktime,video/x-msvideo|max:102400', // 100MB
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

        $file = $request->file('video');
        $extension = $file->getClientOriginalExtension();
        $slug = Str::random(11);
        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $filename = Str::slug($originalName).'-'.uniqid().'.'.$extension;
        $storagePath = "videos/{$slug}/{$filename}";

        // Upload to Firebase Storage
        $bucket = Firebase::storage()->getBucket();

        $uploadedObject = $bucket->upload(
            fopen($file->getPathname(), 'r'),
            [
                'name' => $storagePath,
            ]
        );

        // Get public URL or download URL
        // In Firebase Storage, if bucket is not public, we might need a signed URL.
        // Or if it's public (which app probably requires), we can use the public format:
        $bucketName = env('FIREBASE_STORAGE_BUCKET');
        $videoUrl = "https://firebasestorage.googleapis.com/v0/b/{$bucketName}/o/".urlencode($storagePath).'?alt=media';

        $thumbnailUrl = null;
        if ($request->hasFile('thumbnail')) {
            $thumbnailFile = $request->file('thumbnail');
            $thumbnailExt = $thumbnailFile->getClientOriginalExtension();
            $thumbnailPath = "videos/{$slug}/thumbnail-".uniqid().'.'.$thumbnailExt;

            $bucket->upload(
                fopen($thumbnailFile->getPathname(), 'r'),
                ['name' => $thumbnailPath]
            );
            $thumbnailUrl = "https://firebasestorage.googleapis.com/v0/b/{$bucketName}/o/".urlencode($thumbnailPath).'?alt=media';
        }

        Video::create([
            'title' => $request->title,
            'slug' => $slug,
            'description' => $request->description,
            'tags' => $request->tags ?? [],
            'uploaded_by' => auth()->id(),
            'video_url' => $videoUrl,
            'thumbnail' => $thumbnailUrl,
            'storage_path' => $storagePath,
            'file_path' => $storagePath,
            'provider' => 'firebase',
        ]);

        return redirect()->route('admin.videos.index')->with('success', 'Video berhasil diunggah.');
    }

    /**
     * Show the form for editing the specified video.
     */
    public function edit(Video $video)
    {
        return Inertia::render('Admin/Video/Edit', [
            'video' => $video,
        ]);
    }

    /**
     * Update the specified video in storage.
     */
    public function update(Request $request, Video $video)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'thumbnail' => 'nullable|image|max:5120',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
        ], [
            'title.required' => 'Judul wajib diisi.',
            'title.string' => 'Judul harus berupa teks.',
            'title.max' => 'Judul maksimal 255 karakter.',
            'thumbnail.image' => 'Thumbnail harus berupa gambar.',
            'thumbnail.max' => 'Ukuran thumbnail maksimal 5MB.',
        ]);

        $updateData = [
            'title' => $request->title,
            'description' => $request->description,
            'tags' => $request->tags ?? [],
        ];

        if ($request->hasFile('thumbnail')) {
            $bucket = Firebase::storage()->getBucket();
            $thumbnailFile = $request->file('thumbnail');
            $thumbnailExt = $thumbnailFile->getClientOriginalExtension();
            $slug = Str::slug($request->title);
            $thumbnailPath = "videos/{$slug}/thumbnail-".uniqid().'.'.$thumbnailExt;

            $bucket->upload(
                fopen($thumbnailFile->getPathname(), 'r'),
                ['name' => $thumbnailPath]
            );
            $bucketName = env('FIREBASE_STORAGE_BUCKET');
            $thumbnailUrl = "https://firebasestorage.googleapis.com/v0/b/{$bucketName}/o/".urlencode($thumbnailPath).'?alt=media';

            $updateData['thumbnail'] = $thumbnailUrl;
        }

        $video->update($updateData);

        return redirect()->route('admin.videos.index')->with('success', 'Video berhasil diperbarui.');
    }

    /**
     * Remove the specified video from storage.
     */
    public function destroy(Video $video)
    {
        if ($video->storage_path && $video->provider === 'firebase') {
            try {
                $bucketName = env('FIREBASE_STORAGE_BUCKET');
                $bucket = Firebase::storage()->getBucket();

                // Delete Video
                $object = $bucket->object($video->storage_path);
                if ($object->exists()) {
                    $object->delete();
                }

                // Delete Thumbnail if exists
                if ($video->thumbnail) {
                    $search = "https://firebasestorage.googleapis.com/v0/b/{$bucketName}/o/";
                    if (str_contains($video->thumbnail, $search)) {
                        $thumbnailPath = explode('?', str_replace($search, '', $video->thumbnail))[0];
                        $thumbnailPath = urldecode($thumbnailPath);
                        $thumbObject = $bucket->object($thumbnailPath);
                        if ($thumbObject->exists()) {
                            $thumbObject->delete();
                        }
                    }
                }
            } catch (\Exception $e) {
                // Log the error but allow database deletion
                \Log::error('Firebase video/thumbnail deletion failed: '.$e->getMessage());
            }
        }

        $video->delete();

        return redirect()->back()->with('success', 'Video berhasil dihapus.');
    }
}

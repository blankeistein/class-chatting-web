<?php

namespace App\Http\Controllers\PrivateAPI;

use App\Enums\VideoProviderEnum;
use App\Http\Controllers\Controller;
use App\Models\Video;
use Dedoc\Scramble\Attributes\BodyParameter;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\PathParameter;
use Dedoc\Scramble\Attributes\QueryParameter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

#[Group('Private Videos', 'Endpoint private untuk manajemen video yang digunakan oleh consumer internal atau aplikasi legacy.', 50)]
class VideoController extends Controller
{
    #[Endpoint(
        operationId: 'privateVideosList',
        title: 'List private videos',
        description: 'Mengambil daftar video private. Request memakai `page` berbasis 1, tetapi field `page` pada response saat ini mengikuti implementasi legacy dan bernilai indeks berbasis 0.'
    )]
    #[PathParameter('api_key', 'Private API key yang wajib dikirim pada path URL.', example: 'test-private-key')]
    #[QueryParameter('page', 'Nomor halaman request. Nilai minimum efektif adalah 1.', required: false, type: 'integer', example: 1)]
    #[QueryParameter('limit', 'Jumlah video per halaman.', required: false, type: 'integer', example: 20)]
    #[QueryParameter('search', 'Filter judul video berbasis kata kunci.', required: false, example: 'tajwid')]
    #[QueryParameter('video', 'Flag legacy untuk filtering tambahan pada implementasi lama.', required: false, example: '1')]
    public function index(Request $request): JsonResponse
    {
        $page = max(0, (int) $request->query('page', 1) - 1);
        $limit = (int) $request->query('limit', 20);
        $search = $request->query('search');
        $video = $request->query('video');

        $query = Video::query()
            ->when(! empty($video), fn ($q) => $q->where('video', ''))
            ->when($search, fn ($q) => $q->where('title', 'like', "%{$search}%"))
            ->orderBy('id', 'DESC')
            ->limit($limit)
            ->offset($page * $limit)
            ->get();

        return response()->json([
            'page' => $page,
            'limit' => $limit,
            'search' => $search,
            'list_video' => $query->map(function ($video) {
                $step1 = Str::after($video->video_url, '/o/');
                $step2 = Str::before($step1, '?');
                $result = rawurldecode($step2);

                return [
                    'id' => $video->id,
                    'video_id' => $video->slug,
                    'title' => $video->title,
                    'description' => $video->description,
                    'author' => $video->uploader->name,
                    'location' => '',
                    'date_upload' => $video->created_at,
                    'thumbnail' => $video->thumbnail,
                    'video' => $result,
                ];
            }),
            'slug' => 'list',
            'status' => 'success',
        ])->header('Access-Control-Allow-Origin', '*');
    }

    #[Endpoint(
        operationId: 'privateVideosCreate',
        title: 'Create private video',
        description: 'Membuat data video private baru. Implementasi saat ini menerima body JSON secara fleksibel dan akan mengembalikan payload yang sama beserta `video_id` dan `date_upload` yang dibuat server.'
    )]
    #[PathParameter('api_key', 'Private API key yang wajib dikirim pada path URL.', example: 'test-private-key')]
    #[BodyParameter('title', 'Judul video.', required: false, example: 'Video Pembelajaran Bab 1')]
    #[BodyParameter('slug', 'Slug unik video.', required: false, example: 'video-pembelajaran-bab-1')]
    #[BodyParameter('description', 'Deskripsi video.', required: false, example: 'Ringkasan materi video.')]
    #[BodyParameter('uploaded_by', 'ID user pengunggah.', required: false, type: 'integer', example: 1)]
    #[BodyParameter('thumbnail', 'URL atau path thumbnail video.', required: false, example: 'https://example.com/thumbnails/video-1.jpg')]
    #[BodyParameter('video_url', 'URL sumber video.', required: false, example: 'https://example.com/videos/video-1.m3u8')]
    #[BodyParameter('storage_path', 'Path penyimpanan video di storage provider.', required: false, example: 'videos/video-1/index.m3u8')]
    #[BodyParameter('provider', 'Nama provider penyimpanan video.', required: false, example: 'firebase')]
    #[BodyParameter('metadata', 'Metadata tambahan dalam bentuk objek JSON.', required: false, type: 'array<string, mixed>', example: ['duration' => 120, 'resolution' => '1280x720'])]
    #[BodyParameter('tags', 'Daftar tag video.', required: false, type: 'array<int, string>', example: ['kelas-4', 'tajwid'])]
    public function create(Request $request): JsonResponse
    {
        $data = $this->normalizeProvider($request->json()->all(), true);

        do {
            $videoId = Str::random(11);
        } while (Video::where('slug', $videoId)->exists());

        $video = Video::create([
            'slug' => $videoId,
            'title' => $data['title'] ?? '',
            'uploaded_by' => 1,
        ]);

        return response()->json([
            'slug' => 'add',
            'data' => [
                'id' => $video->id,
                'video_id' => $video->slug,
                'title' => $video->title,
                'description' => $video->description,
                'author' => $video->uploader->name,
                'location' => 'need_update',
                'date_upload' => $video->created_at,
                'thumbnail' => $video->thumbnail,
                'video' => '',
            ],
            'status' => 'success',
        ])->header('Access-Control-Allow-Origin', '*');
    }

    #[Endpoint(
        operationId: 'privateVideosShow',
        title: 'Get private video detail',
        description: 'Mengambil detail satu video private berdasarkan `video_id` legacy.'
    )]
    #[PathParameter('api_key', 'Private API key yang wajib dikirim pada path URL.', example: 'test-private-key')]
    #[PathParameter('video_id', 'Identifier legacy video yang dipakai endpoint private.', example: 'abc123def45')]
    public function show(Request $request, string $private_api, string $video_id): JsonResponse
    {
        $video = Video::query()->where('slug', $video_id)->first();

        if (! $video) {
            return response()->json([
                'status' => 'error',
                'message' => 'Video not Found',
            ], 500)->header('Access-Control-Allow-Origin', '*');
        }

        $location = @unserialize($video->location);

        $data = $video->toArray();
        $data['location'] = $location === false ? 'need_update' : $location;

        $step1 = Str::after($video->video_url, '/o/');
        $step2 = Str::before($step1, '?');
        $video_url = rawurldecode($step2);

        return response()->json([
            'data' => [
                'id' => $data['id'],
                'video_id' => $data['slug'],
                'title' => $data['title'],
                'description' => $data['description'],
                'author' => $video->uploader->name,
                'location' => $data['location'],
                'date_upload' => $data['created_at'],
                'thumbnail' => $data['thumbnail'],
                'video' => $video_url,
            ],
            'slug' => 'detail',
            'status' => 'success',
        ])->header('Access-Control-Allow-Origin', '*');
    }

    #[Endpoint(
        operationId: 'privateVideosUpdate',
        title: 'Update private video',
        description: 'Memperbarui data video private berdasarkan `video_id` legacy. Body JSON yang dikirim akan dipakai langsung untuk operasi update.'
    )]
    #[PathParameter('api_key', 'Private API key yang wajib dikirim pada path URL.', example: 'test-private-key')]
    #[PathParameter('video_id', 'Identifier legacy video yang dipakai endpoint private.', example: 'abc123def45')]
    #[BodyParameter('title', 'Judul video.', required: false, example: 'Video Pembelajaran Bab 1')]
    #[BodyParameter('slug', 'Slug unik video.', required: false, example: 'video-pembelajaran-bab-1')]
    #[BodyParameter('description', 'Deskripsi video.', required: false, example: 'Ringkasan materi video yang diperbarui.')]
    #[BodyParameter('uploaded_by', 'ID user pengunggah.', required: false, type: 'integer', example: 1)]
    #[BodyParameter('thumbnail', 'URL atau path thumbnail video.', required: false, example: 'https://example.com/thumbnails/video-1.jpg')]
    #[BodyParameter('video_url', 'URL sumber video.', required: false, example: 'https://example.com/videos/video-1.m3u8')]
    #[BodyParameter('storage_path', 'Path penyimpanan video di storage provider.', required: false, example: 'videos/video-1/index.m3u8')]
    #[BodyParameter('provider', 'Nama provider penyimpanan video.', required: false, example: 'firebase')]
    #[BodyParameter('metadata', 'Metadata tambahan dalam bentuk objek JSON.', required: false, type: 'array<string, mixed>', example: ['duration' => 120, 'resolution' => '1280x720'])]
    #[BodyParameter('tags', 'Daftar tag video.', required: false, type: 'array<int, string>', example: ['kelas-4', 'tajwid'])]
    public function update(Request $request, string $private_api, string $video_id): JsonResponse
    {
        $data = [];
        if ($request->title) {
            $data['title'] = $request->title;
        }

        if ($request->video) {
            $data['video_url'] = $request->video;
        }

        if ($request->description) {
            $data['video_url'] = $request->video;
        }

        $updated = Video::where('slug', $video_id)->update($data);

        if ($updated === false) {
            return response()->json([
                'status' => 'error',
                'message' => 'Update Failed',
            ], 500)->header('Access-Control-Allow-Origin', '*');
        }

        return response()->json([
            'slug' => 'update',
            'data' => $data,
            'status' => 'success',
        ])->header('Access-Control-Allow-Origin', '*');
    }

    #[Endpoint(
        operationId: 'privateVideosDelete',
        title: 'Delete private video',
        description: 'Menghapus video private berdasarkan `video_id` legacy.'
    )]
    #[PathParameter('api_key', 'Private API key yang wajib dikirim pada path URL.', example: 'test-private-key')]
    #[PathParameter('video_id', 'Identifier legacy video yang dipakai endpoint private.', example: 'abc123def45')]
    public function destroy(string $video_id): JsonResponse
    {
        $deleted = Video::where('slug', $video_id)->delete();

        if ($deleted) {
            return response()->json([
                'slug' => 'add',
                'msg' => 'Delete video succesfully',
                'status' => 'success',
            ])->header('Access-Control-Allow-Origin', '*');
        }

        return response()->json([
            'status' => 'error',
            'message' => 'Delete Failed',
        ], 500)->header('Access-Control-Allow-Origin', '*');
    }

    private function normalizeProvider(array $data, bool $setDefault = false): array
    {
        if (array_key_exists('provider', $data)) {
            $data['provider'] = VideoProviderEnum::tryFrom((string) $data['provider'])?->value
                ?? VideoProviderEnum::Local->value;
        } elseif ($setDefault) {
            $data['provider'] = VideoProviderEnum::Local->value;
        }

        return $data;
    }
}

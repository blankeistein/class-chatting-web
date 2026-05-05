<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateVideoHlsUrlRequest;
use App\Models\Video;
use Dedoc\Scramble\Attributes\BodyParameter;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\HeaderParameter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

#[Group('Videos', 'Endpoint API untuk sinkronisasi data video dari service internal.', 30)]
class VideoController extends Controller
{
    #[Endpoint(
        operationId: 'videosUpdateHlsUrl',
        title: 'Update video HLS URL',
        description: 'Dipakai service transcoding untuk mengisi `video_url` dengan URL Firebase `.m3u8` berdasarkan `slug` video yang sudah dibuat saat upload awal.'
    )]
    #[HeaderParameter('X-API-KEY', 'API key internal untuk mengamankan callback HLS.', required: true, example: 'test-private-key')]
    #[BodyParameter('slug', 'Slug video yang akan diperbarui.', required: true, example: 'abc123def45')]
    #[BodyParameter('video_url', 'URL file HLS `.m3u8` hasil transcoding.', required: true, example: 'https://firebasestorage.googleapis.com/v0/b/example-bucket/o/hls%2Fabc123def45%2Findex.m3u8?alt=media')]
    public function updateHlsUrl(UpdateVideoHlsUrlRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $video = Video::query()
            ->where('slug', $validated['slug'])
            ->first();

        if (! $video) {
            return response()->json([
                'status' => 'error',
                'message' => 'Video not found.',
            ], 404);
        }

        $video->update([
            'video_url' => $validated['video_url'],
        ]);

        return response()->json([
            'slug' => 'update-hls-url',
            'status' => 'success',
            'data' => [
                'id' => $video->id,
                'slug' => $video->slug,
                'storage_path' => $video->storage_path,
                'video_url' => $video->video_url,
            ],
        ]);
    }
}

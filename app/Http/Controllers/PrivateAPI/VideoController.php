<?php

namespace App\Http\Controllers\PrivateAPI;

use App\Http\Controllers\Controller;
use App\Models\Video;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class VideoController extends Controller
{
    public function index(Request $request)
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
            'list_video' => $query,
            'slug' => 'list',
            'status' => 'success',
        ])->header('Access-Control-Allow-Origin', '*');
    }

    public function create(Request $request)
    {
        $data = $request->json()->all();

        do {
            $videoId = Str::random(11);
        } while (Video::where('video_id', $videoId)->exists());

        $data['video_id'] = $videoId;
        $data['date_upload'] = now()->format('Y-m-d H:i:s');

        Video::create($data);

        return response()->json([
            'slug' => 'add',
            'data' => $data,
            'status' => 'success',
        ])->header('Access-Control-Allow-Origin', '*');
    }

    public function show(Request $request, $video_id)
    {
        $video = Video::query()->where('video_id', $video_id)->first();

        if (! $video) {
            return response()->json([
                'status' => 'error',
                'message' => 'Video not Found',
            ], 500)->header('Access-Control-Allow-Origin', '*');
        }

        $location = @unserialize($video->location);

        $data = $video->toArray();
        $data['location'] = $location === false ? 'need_update' : $location;

        return response()->json([
            'data' => $data,
            'slug' => 'detail',
            'status' => 'success',
        ])->header('Access-Control-Allow-Origin', '*');
    }

    public function update(Request $request, string $video_id)
    {
        $data = $request->json()->all();
        $updated = Video::where('video_id', $video_id)->update($data);

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

    public function destroy(string $video_id)
    {
        $deleted = Video::where('video_id', $video_id)->delete();

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
}

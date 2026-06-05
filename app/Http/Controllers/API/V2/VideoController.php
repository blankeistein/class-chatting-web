<?php

namespace App\Http\Controllers\API\V2;

use App\Enums\ActivationCodeTierEnum;
use App\Http\Controllers\Controller;
use App\Models\ActivationCode;
use App\Models\Video;
use App\Models\VideoView;
use Dedoc\Scramble\Attributes\BodyParameter;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\HeaderParameter;
use Dedoc\Scramble\Attributes\PathParameter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

#[Group('Video V2', 'Endpoint versi 2 untuk video dengan pengaman.', 21)]
class VideoController extends Controller
{
    #[Endpoint(
        operationId: 'publicVideosTrackViewV2',
        title: 'Track video view v2',
        description: 'Mencatat view video dengan validasi kode aktivasi dan autentikasi pengguna pada endpoint versi 2.'
    )]
    #[HeaderParameter('Authorization', 'Bearer token untuk autentikasi pengguna. Format: `Bearer <token>`.', required: true, example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')]
    #[PathParameter('video', 'UUID atau ID video yang akan ditonton.', example: 'video-uuid-001')]
    #[BodyParameter('activation_code', 'Kode aktivasi yang valid dan aktif untuk mengakses video.', required: true, example: 'AKTIVASI-001')]
    public function store(Request $request, Video $video): JsonResponse
    {
        // Get authenticated user
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }

        $validator = Validator::make($request->all(), [
            'activation_code' => 'required|string|exists:activation_codes,code',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Get activation code with tier information
        $activationCode = ActivationCode::where('code', $request->activation_code)
            ->where('is_active', true)
            ->first();

        if (!$activationCode) {
            return response()->json([
                'success' => false,
                'message' => 'Kode aktivasi tidak aktif atau tidak ditemukan.',
            ], 404);
        }

        // Check if activation code is activated
        if (!$activationCode->activated_at) {
            return response()->json([
                'success' => false,
                'message' => 'Kode aktivasi belum diaktifkan',
            ], 403);
        }

        // Track video view
        $videoView = VideoView::create([
            'video_id' => $video->id,
            'user_id' => $user->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'viewed_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Video view tracked successfully',
            'data' => [
                'video_id' => $video->id,
                'video_title' => $video->title,
                'view_id' => $videoView->id,
                'viewed_at' => $videoView->viewed_at,
                'level' => [
                    'slug' => $activationCode->tier->value,
                    'name' => $activationCode->tier->label(),
                ],
            ],
        ], 201);
    }
}

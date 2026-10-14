<?php

namespace App\Http\Controllers\Admin\Apps\ClassChatting;

use App\Http\Controllers\Controller;
use App\Http\Requests\ClassChatting\SettingsRequest;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;
use Kreait\Firebase\Contract\Database;

class SettingController extends Controller
{
    public function __construct(
        protected Database $database,
    ) {}

    public function index(): Response
    {
        return Inertia::render('Admin/Apps/ClassChatting/Settings');
    }

    public function update(SettingsRequest $request): JsonResponse
    {
        try {
            $this->database
                ->getReference('settings')
                ->update([
                    'announcements' => $request->string('announcement')->toString(),
                    'noRekening' => $request->string('noRekening')->toString(),
                ]);

            return response()->json([
                'message' => 'Pengaturan Class Chatting berhasil disimpan.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal menyimpan pengaturan Class Chatting: '.$e->getMessage(),
            ], 500);
        }
    }
}

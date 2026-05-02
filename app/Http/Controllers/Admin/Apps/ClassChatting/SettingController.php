<?php

namespace App\Http\Controllers\Admin\Apps\ClassChatting;

use App\Http\Controllers\Controller;
use App\Http\Requests\ClassChattingSettingsRequest;
use Google\Cloud\Firestore\FirestoreClient;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function __construct(
        protected FirestoreClient $firestore,
    ) {}

    public function index(): Response
    {
        return Inertia::render('Admin/Apps/ClassChatting/Settings');
    }

    public function update(ClassChattingSettingsRequest $request): JsonResponse
    {
        try {
            $this->firestore
                ->collection('settings')
                ->document('general')
                ->set([
                    'announcement' => $request->string('announcement')->toString(),
                    'noRekening' => $request->string('noRekening')->toString(),
                    'updatedAt' => now(),
                ], [
                    'merge' => true,
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

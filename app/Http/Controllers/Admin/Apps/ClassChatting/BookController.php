<?php

namespace App\Http\Controllers\Admin\Apps\ClassChatting;

use App\Http\Controllers\Controller;
use App\Http\Requests\ClassChattingSettingsRequest;
use Google\Cloud\Firestore\FirestoreClient;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;

class BookController extends Controller
{
    public function __construct(
        protected FirestoreClient $firestore,
    ) {}

    public function index()
    {
        return Inertia::render('Admin/Apps/ClassChatting/Book/Index');
    }

    public function indexRTDB()
    {
        return Inertia::render('Admin/Apps/ClassChatting/Book/IndexRTDB');
    }

    public function category()
    {
        return Inertia::render('Admin/Apps/ClassChatting/Book/Category');
    }

    public function settings()
    {
        return Inertia::render('Admin/Apps/ClassChatting/Settings');
    }

    public function saveSettings(ClassChattingSettingsRequest $request): JsonResponse
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

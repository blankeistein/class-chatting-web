<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\EmailConfigService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailConfigController extends Controller
{
    public function __construct(
        protected EmailConfigService $service,
    ) {}

    public function index(): Response
    {
        $config = $this->service->getActiveConfig();

        return Inertia::render('Admin/Settings/Email', [
            'emailConfig' => $config,
        ]);
    }

    public function checkConnection(): JsonResponse
    {
        $result = $this->service->checkSmtpConnection();

        return response()->json($result);
    }

    public function sendTestEmail(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|max:254',
        ]);

        $result = $this->service->sendTestEmail($request->email);

        return response()->json($result);
    }
}

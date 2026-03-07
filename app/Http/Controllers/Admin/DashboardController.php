<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivationCode;
use App\Models\Book;
use App\Models\User;
use App\Models\Video;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = Cache::remember('admin_dashboard_stats', now()->addMinutes(60), function () {
            return [
                'total_books' => Book::count(),
                'total_users' => User::where('role', 'user')->count(),
                'total_videos' => Video::count(),
                'total_activation_codes' => ActivationCode::count(),
            ];
        });

        return Inertia::render('Admin/Index', [
            'stats' => $stats,
        ]);
    }
}

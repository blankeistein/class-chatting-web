<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Admin area permissions — if user has ANY of these, they can access admin panel.
     *
     * @var array<int, string>
     */
    private const ADMIN_AREA_PERMISSIONS = [
        'users.view', 'books.view', 'videos.view',
        'activation-codes.view', 'schools.view', 'students.view',
        'teachers.view', 'regions.view', 'settings.view',
        'email-config.view', 'apps.view', 'roles.view', 'permissions.view',
    ];

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if (! $user) {
            return redirect()->route('login')->withErrors('Anda harus login terlebih dahulu.');
        }

        if ($user->isAdmin() || $user->isStaff() || $user->hasRole(['Admin', 'Developer']) || $user->hasAnyPermission(self::ADMIN_AREA_PERMISSIONS)) {
            return $next($request);
        }

        return redirect()->route('home')->withErrors('Anda tidak memiliki hak akses ke halaman ini.');
    }
}

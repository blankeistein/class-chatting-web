<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth.user' => fn () => $request->user() ? [
                'name' => $request->user()->name,
                'email' => $request->user()->email,
                'image' => $request->user()->image,
                'role' => $request->user()->role,
                'notifications' => $request->user()->notifications()->limit(5)->get(),
                'unread_notifications_count' => $request->user()->unreadNotifications()->count(),
            ] : null,
            'auth.firebase' => fn () => $request->session()->get('firebase_auth'),
        ];
    }
}

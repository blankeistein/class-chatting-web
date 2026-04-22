<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = $request->user()->notifications()->paginate(20);

        if ($request->wantsJson()) {
            return $notifications;
        }

        if (Auth::user()->role === 'admin') {
            return Inertia::render('Admin/Notifications', [
                'notifications' => $notifications,
            ]);
        }

        return Inertia::render('Notifications', [
            'notifications' => $notifications,
        ]);
    }

    public function markAsRead(Request $request, $id)
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        return back();
    }

    public function markAllAsRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        return back();
    }

    public function destroy(Request $request, $id)
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->delete();

        return back();
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePermissionRequest;
use App\Http\Requests\Admin\UpdatePermissionRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    /**
     * Display a listing of permissions grouped by module.
     */
    public function index(Request $request): Response
    {
        if (! Gate::allows('manageSettings') && ! $request->user()?->can('permissions.view')) {
            abort(403, 'Anda tidak memiliki hak akses.');
        }

        $search = trim((string) $request->input('search', ''));

        $permissionsQuery = Permission::query()
            ->withCount('roles')
            ->when($search !== '', function ($query) use ($search): void {
                $query->where('name', 'like', "%{$search}%");
            })
            ->orderBy('name');

        $allPermissions = $permissionsQuery->get();

        $grouped = $allPermissions->groupBy(function (Permission $permission): string {
            return explode('.', $permission->name)[0] ?? 'general';
        });

        return Inertia::render('Admin/Permission/Index', [
            'permissionGroups' => $grouped,
            'filters' => [
                'search' => $search,
            ],
            'totalCount' => $allPermissions->count(),
        ]);
    }

    /**
     * Store a newly created permission in storage.
     */
    public function store(StorePermissionRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        Permission::create([
            'name' => $validated['name'],
            'guard_name' => 'web',
        ]);

        return redirect()->route('admin.permissions.index')
            ->with('success', 'Permission berhasil ditambahkan.');
    }

    /**
     * Update the specified permission in storage.
     */
    public function update(UpdatePermissionRequest $request, Permission $permission): RedirectResponse
    {
        $validated = $request->validated();

        $permission->update([
            'name' => $validated['name'],
        ]);

        return redirect()->route('admin.permissions.index')
            ->with('success', 'Permission berhasil diperbarui.');
    }

    /**
     * Remove the specified permission from storage.
     */
    public function destroy(Permission $permission): RedirectResponse
    {
        if (! Gate::allows('manageSettings') && ! auth()->user()?->can('permissions.delete')) {
            abort(403, 'Anda tidak memiliki hak akses.');
        }

        $permission->delete();

        return redirect()->route('admin.permissions.index')
            ->with('success', 'Permission berhasil dihapus.');
    }
}

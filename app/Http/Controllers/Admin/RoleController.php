<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreRoleRequest;
use App\Http\Requests\Admin\UpdateRoleRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    /**
     * Display a listing of the roles.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Role::class);

        $search = trim((string) $request->input('search', ''));
        $perPage = (int) $request->input('per_page', 25);

        if (! in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 25;
        }

        $roles = Role::query()
            ->withCount(['permissions', 'users'])
            ->when($search !== '', function ($query) use ($search): void {
                $query->where('name', 'like', "%{$search}%");
            })
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Admin/Role/Index', [
            'roles' => $roles,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Show the form for creating a new role.
     */
    public function create(): Response
    {
        Gate::authorize('create', Role::class);

        $permissions = Permission::all()
            ->groupBy(function (Permission $permission): string {
                return explode('.', $permission->name)[0] ?? 'general';
            });

        return Inertia::render('Admin/Role/Create', [
            'permissionGroups' => $permissions,
        ]);
    }

    /**
     * Store a newly created role in storage.
     */
    public function store(StoreRoleRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $role = Role::create([
            'name' => $validated['name'],
            'guard_name' => 'web',
        ]);

        if (! empty($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return redirect()->route('admin.roles.index')
            ->with('success', 'Role berhasil dibuat.');
    }

    /**
     * Display the specified role.
     */
    public function show(Role $role): Response
    {
        Gate::authorize('view', $role);

        $role->load('permissions');

        $users = User::role($role->name)
            ->select(['id', 'name', 'email', 'avatar', 'role', 'is_active'])
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('Admin/Role/Show', [
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name'),
                'created_at' => $role->created_at,
            ],
            'users' => $users,
        ]);
    }

    /**
     * Show the form for editing the specified role.
     */
    public function edit(Role $role): Response
    {
        Gate::authorize('update', $role);

        $role->load('permissions');

        $permissions = Permission::all()
            ->groupBy(function (Permission $permission): string {
                return explode('.', $permission->name)[0] ?? 'general';
            });

        return Inertia::render('Admin/Role/Edit', [
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name'),
            ],
            'permissionGroups' => $permissions,
        ]);
    }

    /**
     * Update the specified role in storage.
     */
    public function update(UpdateRoleRequest $request, Role $role): RedirectResponse
    {
        $validated = $request->validated();

        $role->update([
            'name' => $validated['name'],
        ]);

        $role->syncPermissions($validated['permissions'] ?? []);

        return redirect()->route('admin.roles.index')
            ->with('success', 'Role berhasil diperbarui.');
    }

    /**
     * Remove the specified role from storage.
     */
    public function destroy(Role $role): RedirectResponse
    {
        Gate::authorize('delete', $role);

        if (in_array($role->name, ['Admin', 'Developer'], true)) {
            return back()->withErrors('Role Admin dan Developer tidak dapat dihapus.');
        }

        $role->delete();

        return redirect()->route('admin.roles.index')
            ->with('success', 'Role berhasil dihapus.');
    }
}

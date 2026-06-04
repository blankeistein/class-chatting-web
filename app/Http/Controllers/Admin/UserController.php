<?php

namespace App\Http\Controllers\Admin;

use App\Enums\RoleEnum;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserBook;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Display a listing of the users.
     */
    public function index(Request $request): Response
    {
        $query = User::query();

        // Search by name, email, username, or firebase_uid
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhere('firebase_uid', 'like', "%{$search}%");
            });
        }

        // Filter by role
        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        // Sort
        $sort = $request->input('sort', 'latest');
        switch ($sort) {
            case 'oldest':
                $query->oldest();
                break;
            case 'name_asc':
                $query->orderBy('name', 'asc');
                break;
            case 'name_desc':
                $query->orderBy('name', 'desc');
                break;
            case 'latest':
            default:
                $query->latest();
                break;
        }

        $perPage = (int) $request->input('perPage', 25);

        $users = $query->with(['books:id,title,cover_url', 'metadata:id,user_id,key,value'])
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Admin/User/Index', [
            'users' => $users,
            'filters' => $request->only(['search', 'sort', 'role']),
        ]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function create(): Response | RedirectResponse
    {
        if (! Gate::allows('create', User::class)) {
            return back()->withErrors([
                'authorization' => 'Kamu tidak punya hak untuk menggunakan fitur ini.',
            ]);
        }

        return Inertia::render('Admin/User/Create');
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        if (! Gate::allows('create', User::class)) {
            return back()->withErrors([
                'authorization' => 'Kamu tidak punya hak untuk menggunakan fitur ini.',
            ]);
        }

        $allowedRoles = RoleEnum::values();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'username' => 'nullable|string|max:255|unique:users',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:8|confirmed',
            'role' => ['required', 'string', Rule::in($allowedRoles)],
            'is_active' => 'boolean',
        ]);

        // Check if user can assign this role
        $tempUser = new User;
        if (! Gate::allows('changeRole', [$tempUser, $request->role])) {
            return back()->withErrors([
                'authorization' => 'Kamu tidak punya hak untuk mengubah role ini.',
            ]);
        }

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'username' => $request->username,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'is_active' => $request->has('is_active') ? $request->is_active : true,
        ]);

        return redirect()->route('admin.users.index')->with('success', 'User berhasil ditambahkan.');
    }

    /**
     * Show the form for editing the specified user.
     */
    public function show(User $user): Response
    {
        return Inertia::render('Admin/User/Show', [
            'user' => $user,
        ]);
    }

    public function edit(User $user): Response
    {
        return Inertia::render('Admin/User/Edit', [
            'user' => $user,
        ]);
    }

    /**
     * Update the specified user in storage.
     */
    public function update(Request $request, User $user): RedirectResponse
    {
        if (! Gate::allows('update', $user)) {
            return back()->withErrors([
                'authorization' => 'Kamu tidak punya hak untuk menggunakan fitur ini.',
            ]);
        }

        $allowedRoles = RoleEnum::values();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'username' => ['nullable', 'string', 'max:255', Rule::unique('users')->ignore($user->id)],
            'phone' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:8|confirmed',
            'role' => ['required', 'string', Rule::in($allowedRoles)],
            'is_active' => 'boolean',
        ]);

        // Check if user can change to this role
        if ($request->role !== $user->role) {
            if (! Gate::allows('changeRole', [$user, $request->role])) {
                return back()->withErrors([
                    'authorization' => 'Kamu tidak punya hak untuk mengubah role ini.',
                ]);
            }
        }

        $data = [
            'name' => $request->name,
            'email' => $request->email,
            'username' => $request->username,
            'phone' => $request->phone,
            'role' => $request->role,
            'is_active' => $request->has('is_active') ? $request->is_active : true,
        ];

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return redirect()->route('admin.users.index')->with('success', 'User berhasil diperbarui.');
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(User $user): RedirectResponse
    {
        if (! Gate::allows('delete', $user)) {
            return back()->withErrors([
                'authorization' => 'Kamu tidak punya hak untuk menggunakan fitur ini.',
            ]);
        }

        $user->delete();

        return redirect()->back()->with('success', 'User berhasil dihapus.');
    }

    public function bulkDelete(Request $request): RedirectResponse
    {
        return redirect()->back()->withErrors('Fitur bulk delete sedang dalam pengembangan.');
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:users,id'],
        ]);

        $ids = collect($validated['ids'])
            ->filter(fn (int $id): bool => $id !== Auth::id())
            ->values();

        if ($ids->isEmpty()) {
            return redirect()->back()->withErrors('Tidak ada user valid yang dapat dihapus.');
        }

        User::query()->whereIn('id', $ids)->delete();

        return redirect()->back()->with('success', $ids->count().' user berhasil dihapus.');
    }

    /**
     * Display the books owned by the specified user.
     */
    public function books(Request $request, User $user): Response
    {
        $query = UserBook::where('user_id', $user->id)
            ->with([
                'book:id,uuid,title,cover_url,type',
                'activationCode:id,code,type,tier,is_active',
            ]);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('book', function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->input('perPage', 25);

        $userBooks = $query->latest()->paginate($perPage)->withQueryString();

        return Inertia::render('Admin/User/Books', [
            'user' => $user,
            'userBooks' => $userBooks,
            'filters' => $request->only(['search']),
        ]);
    }
}

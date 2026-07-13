<?php

namespace App\Http\Controllers\Admin;

use App\Enums\RoleEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\StudentDataRequest;
use App\Http\Resources\StudentResource;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use App\Services\SyncStudentSchoolToFirestoreService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    public function __construct(
        private SyncStudentSchoolToFirestoreService $syncStudentSchoolToFirestore,
    ) {}

    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $schoolId = $request->input('school_id');
        $className = trim((string) $request->input('class_name', ''));
        $isActive = $request->input('is_active');
        $sortBy = trim((string) $request->input('sort_by', 'created_at'));
        $sortDirection = trim((string) $request->input('sort_direction', 'desc'));
        $perPage = (int) $request->input('per_page', 25);

        if (! in_array($perPage, [25, 50, 100], true)) {
            $perPage = 25;
        }

        if (! in_array($sortBy, ['created_at', 'class_name', 'nis', 'nisn'], true)) {
            $sortBy = 'created_at';
        }

        if (! in_array($sortDirection, ['asc', 'desc'], true)) {
            $sortDirection = 'desc';
        }

        $students = Student::query()
            ->with(['user:id,name,email,username,role,is_active,avatar', 'school:id,code,npsn,name'])
            ->search($search)
            ->forSchool($schoolId)
            ->when($className !== '', fn ($query) => $query->where('class_name', $className))
            ->when($isActive !== null && $isActive !== '', function ($query) use ($isActive) {
                $query->where('is_active', filter_var($isActive, FILTER_VALIDATE_BOOLEAN));
            })
            ->orderBy($sortBy, $sortDirection)
            ->paginate($perPage)
            ->withQueryString();

        $selectedSchool = null;

        if (filled($schoolId)) {
            $selectedSchool = School::query()
                ->whereKey($schoolId)
                ->first(['id', 'code', 'name', 'npsn']);
        }

        return Inertia::render('Admin/Murid/Index', [
            'students' => StudentResource::collection($students),
            'filters' => [
                'search' => $search,
                'school_id' => $schoolId,
                'class_name' => $className,
                'is_active' => $isActive,
                'sort_by' => $sortBy,
                'sort_direction' => $sortDirection,
                'per_page' => $perPage,
            ],
            'filterOptions' => [
                'classNames' => Student::query()
                    ->whereNotNull('class_name')
                    ->where('class_name', '!=', '')
                    ->distinct()
                    ->orderBy('class_name')
                    ->pluck('class_name')
                    ->values(),
            ],
            'selectedSchool' => $selectedSchool,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Murid/Create');
    }

    /**
     * Search users available to assign as students (JSON for autocomplete).
     */
    public function availableUsers(Request $request): JsonResponse
    {
        $search = trim((string) $request->input('search', ''));
        $perPage = (int) $request->input('per_page', 25);
        $includeUserId = $request->integer('include_user_id') ?: null;

        if (! in_array($perPage, [25, 30, 50], true)) {
            $perPage = 25;
        }

        $users = User::query()
            ->where(function ($query) use ($includeUserId): void {
                $query->whereDoesntHave('student');

                if ($includeUserId) {
                    $query->orWhere('id', $includeUserId);
                }
            })
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($builder) use ($search): void {
                    $builder
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->limit($perPage)
            ->get(['id', 'name', 'email', 'username', 'role', 'is_active', 'avatar'])
            ->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'username' => $user->username,
                'role' => $user->role?->value ?? $user->role,
                'is_active' => (bool) $user->is_active,
                'avatar' => $user->image,
            ])
            ->values();

        return response()->json(['data' => $users]);
    }

    public function store(StudentDataRequest $request): RedirectResponse
    {
        if (! Gate::allows('create', Student::class)) {
            return back()->withErrors([
                'authorization' => 'Kamu tidak punya hak untuk menggunakan fitur ini.',
            ]);
        }

        $validated = $request->validated();
        $validated['is_active'] = $validated['is_active'] ?? true;

        $student = Student::query()->create($validated);

        $this->syncUserRoleToStudent((int) $validated['user_id']);
        $this->syncStudentSchoolToFirestore->sync($student);

        return redirect()
            ->route('admin.students.index')
            ->with('success', 'Murid berhasil ditambahkan.');
    }

    public function show(Student $student): Response
    {
        $student->load([
            'user:id,name,email,username,role,is_active,avatar,phone',
            'school:id,code,npsn,name,bentuk_pendidikan,status',
        ]);

        return Inertia::render('Admin/Murid/Show', [
            'student' => new StudentResource($student),
        ]);
    }

    public function edit(Student $student): Response
    {
        $student->load([
            'user:id,name,email,username,role,is_active,avatar',
            'school:id,code,npsn,name',
        ]);

        return Inertia::render('Admin/Murid/Edit', [
            'student' => new StudentResource($student),
        ]);
    }

    public function update(StudentDataRequest $request, Student $student): RedirectResponse
    {
        if (! Gate::allows('update', $student)) {
            return back()->withErrors([
                'authorization' => 'Kamu tidak punya hak untuk menggunakan fitur ini.',
            ]);
        }

        $validated = $request->validated();
        $validated['is_active'] = $validated['is_active'] ?? $student->is_active;

        $student->update($validated);
        $student->refresh();

        $this->syncUserRoleToStudent((int) $validated['user_id']);
        $this->syncStudentSchoolToFirestore->sync($student);

        return redirect()
            ->route('admin.students.index')
            ->with('success', 'Data murid berhasil diperbarui.');
    }

    public function destroy(Student $student): RedirectResponse
    {
        if (! Gate::allows('delete', $student)) {
            return back()->withErrors([
                'authorization' => 'Kamu tidak punya hak untuk menggunakan fitur ini.',
            ]);
        }

        $student->delete();

        return redirect()->back()->with('success', 'Murid berhasil dihapus.');
    }

    private function syncUserRoleToStudent(int $userId): void
    {
        $user = User::query()->find($userId);

        if (! $user) {
            return;
        }

        if ($user->role === RoleEnum::User) {
            $user->forceFill(['role' => RoleEnum::Student])->save();
        }
    }
}

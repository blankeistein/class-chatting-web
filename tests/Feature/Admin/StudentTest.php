<?php

use App\Enums\RoleEnum;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use App\Services\SyncStudentSchoolToFirestoreService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Mockery\MockInterface;

uses(RefreshDatabase::class);

function adminUser(array $attributes = []): User
{
    return User::factory()->create(array_merge([
        'role' => RoleEnum::Admin,
        'is_active' => true,
    ], $attributes));
}

it('redirects guests from the students index', function () {
    $this->get(route('admin.students.index'))
        ->assertRedirect(route('login'));
});

it('forbids non-admin users from managing students', function () {
    $user = User::factory()->create([
        'role' => RoleEnum::User,
        'is_active' => true,
    ]);

    $this->actingAs($user)
        ->get(route('admin.students.index'))
        ->assertRedirect()
        ->assertSessionHasErrors();
});

it('allows admins to list students with the linked user name', function () {
    $admin = adminUser();
    $studentUser = User::factory()->create([
        'name' => 'Budi Santoso',
        'email' => 'budi@example.com',
        'role' => RoleEnum::User,
    ]);
    $school = School::factory()->create(['name' => 'SMAN 1 Contoh']);

    Student::factory()
        ->forUser($studentUser)
        ->forSchool($school)
        ->create([
            'nis' => '1001',
            'class_name' => 'X IPA 1',
        ]);

    $this->actingAs($admin)
        ->get(route('admin.students.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Murid/Index')
            ->has('students.data', 1)
            ->missing('filterOptions.schools')
            ->where('students.data.0.name', 'Budi Santoso')
            ->where('students.data.0.school.name', 'SMAN 1 Contoh')
            ->where('students.data.0.nis', '1001'));
});

it('includes selected school when filtering the students index', function () {
    $admin = adminUser();
    $school = School::factory()->create([
        'name' => 'SMK Filter Selected',
        'npsn' => '12345678',
    ]);
    $otherSchool = School::factory()->create(['name' => 'Sekolah Lain']);
    $user = User::factory()->create();

    Student::factory()->forUser($user)->forSchool($school)->create();
    Student::factory()->forSchool($otherSchool)->create();

    $this->actingAs($admin)
        ->get(route('admin.students.index', ['school_id' => $school->id]))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Murid/Index')
            ->has('students.data', 1)
            ->where('selectedSchool.id', $school->id)
            ->where('selectedSchool.name', 'SMK Filter Selected'));
});

it('allows admins to create a student linked to a user and school', function () {
    $admin = adminUser();
    $studentUser = User::factory()->create([
        'name' => 'Siti Aminah',
        'role' => RoleEnum::User,
    ]);
    $school = School::factory()->create();

    $this->mock(SyncStudentSchoolToFirestoreService::class, function (MockInterface $mock): void {
        $mock->shouldReceive('sync')->once();
    });

    $response = $this->actingAs($admin)
        ->post(route('admin.students.store'), [
            'user_id' => $studentUser->id,
            'school_id' => $school->id,
            'nis' => '2002',
            'nisn' => '0012345678',
            'class_name' => 'XI IPS 2',
            'gender' => 'P',
            'is_active' => true,
        ]);

    $response->assertRedirect(route('admin.students.index'));

    $this->assertDatabaseHas('students', [
        'user_id' => $studentUser->id,
        'school_id' => $school->id,
        'nis' => '2002',
        'nisn' => '0012345678',
        'class_name' => 'XI IPS 2',
        'gender' => 'P',
        'is_active' => 1,
    ]);

    expect(Schema::hasColumn('students', 'name'))->toBeFalse();
    expect($studentUser->fresh()->role)->toBe(RoleEnum::Student);
});

it('rejects creating a student for a user that already has a student profile', function () {
    $admin = adminUser();
    $studentUser = User::factory()->create();
    $schoolA = School::factory()->create();
    $schoolB = School::factory()->create();

    Student::factory()->forUser($studentUser)->forSchool($schoolA)->create();

    $this->actingAs($admin)
        ->from(route('admin.students.create'))
        ->post(route('admin.students.store'), [
            'user_id' => $studentUser->id,
            'school_id' => $schoolB->id,
            'nis' => '3003',
        ])
        ->assertRedirect(route('admin.students.create'))
        ->assertSessionHasErrors('user_id');
});

it('rejects duplicate nis within the same school', function () {
    $admin = adminUser();
    $school = School::factory()->create();
    $existingUser = User::factory()->create();
    $newUser = User::factory()->create();

    Student::factory()->forUser($existingUser)->forSchool($school)->create([
        'nis' => 'DUPLICATE-NIS',
    ]);

    $this->actingAs($admin)
        ->from(route('admin.students.create'))
        ->post(route('admin.students.store'), [
            'user_id' => $newUser->id,
            'school_id' => $school->id,
            'nis' => 'DUPLICATE-NIS',
        ])
        ->assertRedirect(route('admin.students.create'))
        ->assertSessionHasErrors('nis');
});

it('allows admins to update a student', function () {
    $admin = adminUser();
    $studentUser = User::factory()->create(['name' => 'Lama']);
    $school = School::factory()->create();
    $newSchool = School::factory()->create();

    $student = Student::factory()
        ->forUser($studentUser)
        ->forSchool($school)
        ->create([
            'nis' => '111',
            'class_name' => 'X IPA 1',
            'is_active' => true,
        ]);

    $this->mock(SyncStudentSchoolToFirestoreService::class, function (MockInterface $mock): void {
        $mock->shouldReceive('sync')->once();
    });

    $this->actingAs($admin)
        ->put(route('admin.students.update', $student), [
            'user_id' => $studentUser->id,
            'school_id' => $newSchool->id,
            'nis' => '222',
            'nisn' => '9988776655',
            'class_name' => 'XII IPA 3',
            'gender' => 'L',
            'is_active' => false,
        ])
        ->assertRedirect(route('admin.students.index'));

    $this->assertDatabaseHas('students', [
        'id' => $student->id,
        'school_id' => $newSchool->id,
        'nis' => '222',
        'nisn' => '9988776655',
        'class_name' => 'XII IPA 3',
        'gender' => 'L',
        'is_active' => 0,
    ]);
});

it('shows student detail using the user name', function () {
    $admin = adminUser();
    $studentUser = User::factory()->create(['name' => 'Detail User']);
    $school = School::factory()->create(['name' => 'SD Detail']);
    $student = Student::factory()
        ->forUser($studentUser)
        ->forSchool($school)
        ->create();

    $this->actingAs($admin)
        ->get(route('admin.students.show', $student))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Murid/Show')
            ->where('student.data.name', 'Detail User')
            ->where('student.data.user.name', 'Detail User')
            ->where('student.data.school.name', 'SD Detail'));
});

it('allows admins to delete a student without deleting the user', function () {
    $admin = adminUser();
    $studentUser = User::factory()->create();
    $school = School::factory()->create();
    $student = Student::factory()
        ->forUser($studentUser)
        ->forSchool($school)
        ->create();

    $this->actingAs($admin)
        ->delete(route('admin.students.destroy', $student))
        ->assertRedirect();

    $this->assertDatabaseMissing('students', ['id' => $student->id]);
    $this->assertDatabaseHas('users', ['id' => $studentUser->id]);
});

it('returns available users for student assignment autocomplete', function () {
    $admin = adminUser();
    $available = User::factory()->create([
        'name' => 'User Available',
        'email' => 'available@example.com',
    ]);
    $taken = User::factory()->create([
        'name' => 'User Taken',
        'email' => 'taken@example.com',
    ]);
    Student::factory()->forUser($taken)->create();

    $this->actingAs($admin)
        ->getJson(route('admin.students.available-users', ['search' => 'Available']))
        ->assertSuccessful()
        ->assertJsonPath('data.0.id', $available->id)
        ->assertJsonMissing(['email' => 'taken@example.com']);
});

it('includes current user when searching available users with include_user_id', function () {
    $admin = adminUser();
    $current = User::factory()->create([
        'name' => 'Current Student User',
        'email' => 'current-student@example.com',
    ]);
    Student::factory()->forUser($current)->create();

    $this->actingAs($admin)
        ->getJson(route('admin.students.available-users', [
            'include_user_id' => $current->id,
            'search' => 'Current Student',
        ]))
        ->assertSuccessful()
        ->assertJsonPath('data.0.id', $current->id);
});

it('searches students by linked user name', function () {
    $admin = adminUser();
    $school = School::factory()->create();

    $matchUser = User::factory()->create(['name' => 'Cari Nama Unik']);
    $otherUser = User::factory()->create(['name' => 'Lain']);

    Student::factory()->forUser($matchUser)->forSchool($school)->create(['nis' => 'A1']);
    Student::factory()->forUser($otherUser)->forSchool($school)->create(['nis' => 'B2']);

    $this->actingAs($admin)
        ->get(route('admin.students.index', ['search' => 'Nama Unik']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Murid/Index')
            ->has('students.data', 1)
            ->where('students.data.0.name', 'Cari Nama Unik'));
});

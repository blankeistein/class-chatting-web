<?php

use App\Enums\RoleEnum;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use App\Services\FirebaseStorageService;
use App\Services\SyncStudentSchoolToFirestoreService;
use Google\Cloud\Firestore\FirestoreClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Kreait\Firebase\Exception\Auth\FailedToVerifyToken;
use Kreait\Firebase\JWT\Contract\Token as ContractToken;
use Kreait\Laravel\Firebase\Facades\Firebase;
use Mockery\MockInterface;

uses(RefreshDatabase::class);

function mockValidFirebaseToken(string $uid = 'firebase-user-profile-001', ?callable $configureAuth = null): void
{
    $verifiedToken = Mockery::mock(ContractToken::class);
    $claims = Mockery::mock();
    $claims->shouldReceive('get')->once()->with('sub')->andReturn($uid);
    $verifiedToken->shouldReceive('claims')->once()->andReturn($claims);

    $auth = Mockery::mock();
    $auth->shouldReceive('verifyIdToken')
        ->once()
        ->with('valid-firebase-token', false, 5)
        ->andReturn($verifiedToken);

    if ($configureAuth) {
        $configureAuth($auth);
    }

    Firebase::shouldReceive('auth')->andReturn($auth);
}

function expectFirestoreProfileSync(string $firebaseUid, string $name, array $searchUserName): void
{
    $document = Mockery::mock();
    $collection = Mockery::mock();
    $firestore = Mockery::mock(FirestoreClient::class);

    $firestore->shouldReceive('collection')
        ->once()
        ->with('users')
        ->andReturn($collection);

    $collection->shouldReceive('document')
        ->once()
        ->with($firebaseUid)
        ->andReturn($document);

    $document->shouldReceive('set')
        ->once()
        ->with([
            'name' => $name,
            'searchUserName' => $searchUserName,
        ], ['merge' => true])
        ->andReturnNull();

    test()->instance(FirestoreClient::class, $firestore);
}

beforeEach(function () {
    $document = Mockery::mock();
    $document->shouldReceive('set')->byDefault()->andReturnNull();

    $collection = Mockery::mock();
    $collection->shouldReceive('document')->byDefault()->andReturn($document);

    $firestore = Mockery::mock(FirestoreClient::class);
    $firestore->shouldReceive('collection')->byDefault()->with('users')->andReturn($collection);

    $this->instance(FirestoreClient::class, $firestore);
});

it('rejects profile requests without a firebase bearer token', function () {
    $this->getJson('/api/v2/profile')
        ->assertUnauthorized()
        ->assertJson([
            'status' => false,
            'errorCode' => 401,
            'version' => 2,
        ]);
});

it('rejects profile requests with an invalid firebase bearer token', function () {
    $auth = Mockery::mock();
    $auth->shouldReceive('verifyIdToken')
        ->once()
        ->with('invalid-firebase-token', false, 5)
        ->andThrow(new FailedToVerifyToken('Invalid token'));

    Firebase::shouldReceive('auth')->once()->andReturn($auth);

    $this
        ->withHeader('Authorization', 'Bearer invalid-firebase-token')
        ->getJson('/api/v2/profile')
        ->assertUnauthorized()
        ->assertJson([
            'status' => false,
            'errorCode' => 401,
            'version' => 2,
        ]);
});

it('returns the authenticated user profile', function () {
    $user = User::factory()->create([
        'name' => 'Budi Santoso',
        'email' => 'budi@example.com',
        'username' => 'budi',
        'phone' => '+6281234567890',
        'firebase_uid' => 'firebase-user-profile-001',
        'avatar' => 'https://example.com/avatar.webp',
        'is_active' => true,
    ]);

    mockValidFirebaseToken($user->firebase_uid);

    $response = $this
        ->withHeader('Authorization', 'Bearer valid-firebase-token')
        ->getJson('/api/v2/profile');

    $response
        ->assertSuccessful()
        ->assertJson([
            'status' => true,
            'version' => 2,
            'data' => [
                'id' => $user->id,
                'firebase_uid' => 'firebase-user-profile-001',
                'name' => 'Budi Santoso',
                'email' => 'budi@example.com',
                'username' => 'budi',
                'phone' => '+6281234567890',
                'avatar' => 'https://example.com/avatar.webp',
            ],
        ]);
});

it('rejects profile access when the firebase user is inactive', function () {
    User::factory()->create([
        'firebase_uid' => 'firebase-user-profile-001',
        'is_active' => false,
    ]);

    mockValidFirebaseToken('firebase-user-profile-001');

    $this
        ->withHeader('Authorization', 'Bearer valid-firebase-token')
        ->getJson('/api/v2/profile')
        ->assertUnauthorized()
        ->assertJson([
            'status' => false,
            'errorCode' => 401,
            'version' => 2,
        ]);
});

it('updates the user profile and syncs changes to firebase auth and firestore', function () {
    $user = User::factory()->create([
        'name' => 'Old Name',
        'email' => 'old@example.com',
        'username' => 'olduser',
        'phone' => '+6281111111111',
        'firebase_uid' => 'firebase-user-profile-001',
        'avatar' => null,
        'is_active' => true,
    ]);

    mockValidFirebaseToken($user->firebase_uid, function ($auth) use ($user): void {
        $auth->shouldReceive('updateUser')
            ->once()
            ->with($user->firebase_uid, Mockery::on(function (array $properties): bool {
                return $properties['displayName'] === 'Budi Santoso'
                    && $properties['email'] === 'old@example.com'
                    && $properties['phoneNumber'] === '+6281111111111'
                    && array_key_exists('photoUrl', $properties)
                    && $properties['photoUrl'] === null;
            }));
    });

    expectFirestoreProfileSync(
        $user->firebase_uid,
        'Budi Santoso',
        ['budi santoso', 'budi', 'santoso'],
    );

    $response = $this
        ->withHeader('Authorization', 'Bearer valid-firebase-token')
        ->putJson('/api/v2/profile', [
            'name' => 'Budi Santoso',
        ]);

    $response
        ->assertSuccessful()
        ->assertJson([
            'status' => true,
            'version' => 2,
            'message' => 'Profil berhasil diperbarui.',
            'data' => [
                'id' => $user->id,
                'name' => 'Budi Santoso',
                'email' => 'old@example.com',
                'username' => 'olduser',
                'phone' => '+6281111111111',
            ],
        ]);

    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'name' => 'Budi Santoso',
        'email' => 'old@example.com',
        'username' => 'olduser',
        'phone' => '+6281111111111',
    ]);
});

it('assigns school from schoolId and syncs school data to firestore', function () {
    $user = User::factory()->create([
        'name' => 'Siswa Baru',
        'email' => 'siswa@example.com',
        'firebase_uid' => 'firebase-user-profile-001',
        'role' => RoleEnum::User,
        'is_active' => true,
    ]);
    $school = School::factory()->create([
        'name' => 'SMAN 8 Kota',
        'address' => 'Jl. Pendidikan 8',
    ]);

    mockValidFirebaseToken($user->firebase_uid, function ($auth): void {
        $auth->shouldReceive('updateUser')->once();
    });

    expectFirestoreProfileSync(
        $user->firebase_uid,
        'Siswa Baru',
        ['siswa baru', 'siswa', 'baru'],
    );

    $this->mock(SyncStudentSchoolToFirestoreService::class, function (MockInterface $mock) use ($user, $school): void {
        $mock->shouldReceive('syncUserSchool')
            ->once()
            ->withArgs(function (User $syncedUser, School $syncedSchool, bool $onlyIfDocumentExists) use ($user, $school): bool {
                return $syncedUser->is($user)
                    && $syncedSchool->is($school)
                    && $onlyIfDocumentExists === false;
            });
    });

    $response = $this
        ->withHeader('Authorization', 'Bearer valid-firebase-token')
        ->putJson('/api/v2/profile', [
            'name' => 'Siswa Baru',
            'schoolId' => $school->code,
        ]);

    $response
        ->assertSuccessful()
        ->assertJsonPath('data.schoolId', $school->code)
        ->assertJsonPath('data.school.name', 'SMAN 8 Kota')
        ->assertJsonPath('data.role', 'student');

    $this->assertDatabaseHas('students', [
        'user_id' => $user->id,
        'school_id' => $school->id,
        'is_active' => 1,
    ]);

    expect($user->fresh()->role)->toBe(RoleEnum::Student);
});

it('updates existing student school when schoolId is sent on profile update', function () {
    $user = User::factory()->create([
        'name' => 'Siswa Pindah',
        'email' => 'pindah@example.com',
        'firebase_uid' => 'firebase-user-profile-001',
        'role' => RoleEnum::Student,
        'is_active' => true,
    ]);
    $oldSchool = School::factory()->create();
    $newSchool = School::factory()->create(['name' => 'SMP Baru']);
    Student::factory()->forUser($user)->forSchool($oldSchool)->create();

    mockValidFirebaseToken($user->firebase_uid, function ($auth): void {
        $auth->shouldReceive('updateUser')->once();
    });

    expectFirestoreProfileSync(
        $user->firebase_uid,
        'Siswa Pindah',
        ['siswa pindah', 'siswa', 'pindah'],
    );

    $this->mock(SyncStudentSchoolToFirestoreService::class, function (MockInterface $mock) use ($newSchool): void {
        $mock->shouldReceive('syncUserSchool')
            ->once()
            ->withArgs(fn (User $u, School $s, bool $onlyIf): bool => $s->is($newSchool) && $onlyIf === false);
    });

    $this
        ->withHeader('Authorization', 'Bearer valid-firebase-token')
        ->putJson('/api/v2/profile', [
            'name' => 'Siswa Pindah',
            'schoolId' => $newSchool->code,
        ])
        ->assertSuccessful()
        ->assertJsonPath('data.schoolId', $newSchool->code);

    $this->assertDatabaseHas('students', [
        'user_id' => $user->id,
        'school_id' => $newSchool->id,
    ]);

    expect(Student::query()->where('user_id', $user->id)->count())->toBe(1);
});

it('rejects invalid schoolId on profile update', function () {
    $user = User::factory()->create([
        'email' => 'invalid-school@example.com',
        'firebase_uid' => 'firebase-user-profile-001',
        'is_active' => true,
    ]);

    mockValidFirebaseToken($user->firebase_uid);

    $this
        ->withHeader('Authorization', 'Bearer valid-firebase-token')
        ->putJson('/api/v2/profile', [
            'name' => 'Invalid School',
            'schoolId' => 'INVALID-SCHOOL-CODE',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['schoolId']);
});

it('builds searchUserName with full lowercase name and space-separated parts', function () {
    $user = User::factory()->create([
        'name' => 'Old',
        'email' => 'search@example.com',
        'firebase_uid' => 'firebase-user-profile-001',
        'is_active' => true,
    ]);

    mockValidFirebaseToken($user->firebase_uid, function ($auth): void {
        $auth->shouldReceive('updateUser')->once();
    });

    expectFirestoreProfileSync(
        $user->firebase_uid,
        'Ahmad Fauzi Rahman',
        ['ahmad fauzi rahman', 'ahmad', 'fauzi', 'rahman'],
    );

    $this
        ->withHeader('Authorization', 'Bearer valid-firebase-token')
        ->putJson('/api/v2/profile', [
            'name' => 'Ahmad Fauzi Rahman',
        ])
        ->assertSuccessful();
});

it('requires name when updating profile', function () {
    $user = User::factory()->create([
        'firebase_uid' => 'firebase-user-profile-001',
        'is_active' => true,
    ]);

    mockValidFirebaseToken($user->firebase_uid);

    $this
        ->withHeader('Authorization', 'Bearer valid-firebase-token')
        ->putJson('/api/v2/profile', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

it('uploads avatar to firebase storage and syncs photo url', function () {
    $user = User::factory()->create([
        'name' => 'Avatar User',
        'email' => 'avatar@example.com',
        'firebase_uid' => 'firebase-user-profile-001',
        'avatar' => null,
        'is_active' => true,
    ]);

    $avatarUrl = 'https://firebasestorage.googleapis.com/v0/b/bucket/o/image-profile-user%2Fuser-1.webp?alt=media';

    $this->mock(FirebaseStorageService::class, function (MockInterface $mock) use ($avatarUrl): void {
        $mock->shouldReceive('extractPath')->andReturn(null);
        $mock->shouldReceive('delete')->once();
        $mock->shouldReceive('uploadImageAsWebp')->once();
        $mock->shouldReceive('buildUrl')->once()->andReturn($avatarUrl);
    });

    mockValidFirebaseToken($user->firebase_uid, function ($auth) use ($user, $avatarUrl): void {
        $auth->shouldReceive('updateUser')
            ->once()
            ->with($user->firebase_uid, Mockery::on(function (array $properties) use ($avatarUrl): bool {
                return $properties['displayName'] === 'Avatar User'
                    && $properties['email'] === 'avatar@example.com'
                    && $properties['photoUrl'] === $avatarUrl;
            }));
    });

    expectFirestoreProfileSync(
        $user->firebase_uid,
        'Avatar User',
        ['avatar user', 'avatar', 'user'],
    );

    $file = UploadedFile::fake()->image('avatar.jpg', 200, 200);

    $response = $this
        ->withHeader('Authorization', 'Bearer valid-firebase-token')
        ->post('/api/v2/profile', [
            'name' => 'Avatar User',
            'avatar' => $file,
        ], [
            'Accept' => 'application/json',
        ]);

    $response
        ->assertSuccessful()
        ->assertJson([
            'status' => true,
            'version' => 2,
            'data' => [
                'avatar' => $avatarUrl,
            ],
        ]);

    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'avatar' => $avatarUrl,
    ]);
});

it('removes avatar from storage and firebase auth when requested', function () {
    $oldUrl = 'https://firebasestorage.googleapis.com/v0/b/bucket/o/image-profile-user%2Fold.webp?alt=media';

    $user = User::factory()->create([
        'name' => 'Remove Avatar',
        'email' => 'remove@example.com',
        'firebase_uid' => 'firebase-user-profile-001',
        'avatar' => $oldUrl,
        'is_active' => true,
    ]);

    $this->mock(FirebaseStorageService::class, function (MockInterface $mock): void {
        $mock->shouldReceive('extractPath')
            ->once()
            ->andReturn('image-profile-user/old.webp');
        $mock->shouldReceive('delete')
            ->once()
            ->with('image-profile-user/old.webp');
    });

    mockValidFirebaseToken($user->firebase_uid, function ($auth) use ($user): void {
        $auth->shouldReceive('updateUser')
            ->once()
            ->with($user->firebase_uid, Mockery::on(function (array $properties): bool {
                return $properties['photoUrl'] === null;
            }));
    });

    expectFirestoreProfileSync(
        $user->firebase_uid,
        'Remove Avatar',
        ['remove avatar', 'remove', 'avatar'],
    );

    $response = $this
        ->withHeader('Authorization', 'Bearer valid-firebase-token')
        ->putJson('/api/v2/profile', [
            'name' => 'Remove Avatar',
            'remove_avatar' => true,
        ]);

    $response
        ->assertSuccessful()
        ->assertJsonPath('data.avatar', '/assets/images/avatar-placeholder.webp');

    expect($user->fresh()->avatar)->toBeNull();
});

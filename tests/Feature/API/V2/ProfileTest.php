<?php

use App\Models\User;
use App\Services\FirebaseStorageService;
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
                    && $properties['email'] === 'new@example.com'
                    && $properties['phoneNumber'] === '+6282222222222'
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
            'email' => 'new@example.com',
            'username' => 'newuser',
            'phone' => '+6282222222222',
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
                'email' => 'new@example.com',
                'username' => 'newuser',
                'phone' => '+6282222222222',
            ],
        ]);

    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'name' => 'Budi Santoso',
        'email' => 'new@example.com',
        'username' => 'newuser',
        'phone' => '+6282222222222',
    ]);
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
            'email' => 'search@example.com',
        ])
        ->assertSuccessful();
});

it('validates unique email and username when updating profile', function () {
    User::factory()->create([
        'email' => 'taken@example.com',
        'username' => 'takenuser',
        'firebase_uid' => 'other-user',
    ]);

    $user = User::factory()->create([
        'email' => 'me@example.com',
        'username' => 'meuser',
        'firebase_uid' => 'firebase-user-profile-001',
        'is_active' => true,
    ]);

    mockValidFirebaseToken($user->firebase_uid);

    $this
        ->withHeader('Authorization', 'Bearer valid-firebase-token')
        ->putJson('/api/v2/profile', [
            'name' => 'Me',
            'email' => 'taken@example.com',
            'username' => 'takenuser',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email', 'username']);
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
            'email' => 'avatar@example.com',
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
            'email' => 'remove@example.com',
            'remove_avatar' => true,
        ]);

    $response
        ->assertSuccessful()
        ->assertJsonPath('data.avatar', '/assets/images/avatar-placeholder.webp');

    expect($user->fresh()->avatar)->toBeNull();
});

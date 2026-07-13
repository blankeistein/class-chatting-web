<?php

use App\Models\District;
use App\Models\Province;
use App\Models\Regency;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use App\Services\SyncStudentSchoolToFirestoreService;
use Google\Cloud\Firestore\FirestoreClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

it('formats school address as locality, district, regency, province', function () {
    $province = Province::factory()->create(['name' => 'DKI Jakarta']);
    $regency = Regency::factory()->for($province)->create(['name' => 'Jakarta Selatan']);
    $district = District::factory()->for($regency)->create(['name' => 'Kebayoran Baru']);
    $school = School::factory()->create([
        'address' => 'Jl. Melati No. 1',
        'province_id' => $province->id,
        'regency_id' => $regency->id,
        'district_id' => $district->id,
    ]);
    $school->load(['province', 'regency', 'district']);

    $service = new SyncStudentSchoolToFirestoreService(Mockery::mock(FirestoreClient::class));

    expect($service->formatSchoolAddress($school))
        ->toBe('Jl. Melati No. 1, Kebayoran Baru, Jakarta Selatan, DKI Jakarta');
});

it('omits empty locality when school has no address', function () {
    $province = Province::factory()->create(['name' => 'Jawa Barat']);
    $regency = Regency::factory()->for($province)->create(['name' => 'Bandung']);
    $district = District::factory()->for($regency)->create(['name' => 'Coblong']);
    $school = School::factory()->create([
        'address' => null,
        'province_id' => $province->id,
        'regency_id' => $regency->id,
        'district_id' => $district->id,
    ]);
    $school->load(['province', 'regency', 'district']);

    $service = new SyncStudentSchoolToFirestoreService(Mockery::mock(FirestoreClient::class));

    expect($service->formatSchoolAddress($school))
        ->toBe('Coblong, Bandung, Jawa Barat');
});

it('syncs school fields when firestore user document exists', function () {
    $user = User::factory()->create(['firebase_uid' => 'firebase-uid-001']);
    $province = Province::factory()->create(['name' => 'DKI Jakarta']);
    $regency = Regency::factory()->for($province)->create(['name' => 'Jakarta Pusat']);
    $district = District::factory()->for($regency)->create(['name' => 'Gambir']);
    $school = School::factory()->create([
        'name' => 'SMAN 1 Contoh',
        'address' => 'Jl. Merdeka 10',
        'province_id' => $province->id,
        'regency_id' => $regency->id,
        'district_id' => $district->id,
    ]);
    $student = Student::factory()->forUser($user)->forSchool($school)->create();

    $snapshot = Mockery::mock();
    $snapshot->shouldReceive('exists')->once()->andReturn(true);

    $document = Mockery::mock();
    $document->shouldReceive('snapshot')->once()->andReturn($snapshot);
    $document->shouldReceive('set')
        ->once()
        ->with([
            'schoolId' => $school->id,
            'schoolName' => 'SMAN 1 Contoh',
            'schoolAddress' => 'Jl. Merdeka 10, Gambir, Jakarta Pusat, DKI Jakarta',
        ], ['merge' => true]);

    $collection = Mockery::mock();
    $collection->shouldReceive('document')
        ->once()
        ->with('firebase-uid-001')
        ->andReturn($document);

    $firestore = Mockery::mock(FirestoreClient::class);
    $firestore->shouldReceive('collection')
        ->once()
        ->with('users')
        ->andReturn($collection);

    $service = new SyncStudentSchoolToFirestoreService($firestore);
    $service->sync($student);
});

it('skips sync when firestore user document does not exist', function () {
    $user = User::factory()->create(['firebase_uid' => 'firebase-uid-missing']);
    $school = School::factory()->create();
    $student = Student::factory()->forUser($user)->forSchool($school)->create();

    $snapshot = Mockery::mock();
    $snapshot->shouldReceive('exists')->once()->andReturn(false);

    $document = Mockery::mock();
    $document->shouldReceive('snapshot')->once()->andReturn($snapshot);
    $document->shouldNotReceive('set');

    $collection = Mockery::mock();
    $collection->shouldReceive('document')->once()->with('firebase-uid-missing')->andReturn($document);

    $firestore = Mockery::mock(FirestoreClient::class);
    $firestore->shouldReceive('collection')->once()->with('users')->andReturn($collection);

    $service = new SyncStudentSchoolToFirestoreService($firestore);
    $service->sync($student);
});

it('skips sync when user has no firebase uid', function () {
    $user = User::factory()->create(['firebase_uid' => null]);
    $school = School::factory()->create();
    $student = Student::factory()->forUser($user)->forSchool($school)->create();

    $firestore = Mockery::mock(FirestoreClient::class);
    $firestore->shouldNotReceive('collection');

    $service = new SyncStudentSchoolToFirestoreService($firestore);
    $service->sync($student);
});

it('writes school fields without existence check when onlyIfDocumentExists is false', function () {
    $user = User::factory()->create(['firebase_uid' => 'firebase-uid-force']);
    $school = School::factory()->create([
        'name' => 'SD Force Sync',
        'address' => null,
    ]);
    $school->load(['province', 'regency', 'district']);

    $document = Mockery::mock();
    $document->shouldNotReceive('snapshot');
    $document->shouldReceive('set')
        ->once()
        ->with(Mockery::on(function (array $payload) use ($school): bool {
            return $payload['schoolId'] === $school->id
                && $payload['schoolName'] === 'SD Force Sync'
                && array_key_exists('schoolAddress', $payload);
        }), ['merge' => true]);

    $collection = Mockery::mock();
    $collection->shouldReceive('document')->once()->with('firebase-uid-force')->andReturn($document);

    $firestore = Mockery::mock(FirestoreClient::class);
    $firestore->shouldReceive('collection')->once()->with('users')->andReturn($collection);

    $service = new SyncStudentSchoolToFirestoreService($firestore);
    $service->syncUserSchool($user, $school, onlyIfDocumentExists: false);
});

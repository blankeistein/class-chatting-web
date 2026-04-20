<?php

use App\Models\District;
use App\Models\Province;
use App\Models\Regency;
use App\Models\School;
use App\Models\Village;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('returns paginated schools with region context', function () {
    $province = Province::factory()->create([
        'code' => '31',
        'name' => 'DKI Jakarta',
    ]);

    $regency = Regency::factory()->for($province)->create([
        'code' => '3171',
        'name' => 'Jakarta Selatan',
        'type' => 'kota',
    ]);

    $district = District::factory()->for($regency)->create([
        'code' => '3171010',
        'name' => 'Kebayoran Baru',
    ]);

    $village = Village::factory()->for($district)->create([
        'code' => '3171010001',
        'name' => 'Gandaria Utara',
    ]);

    School::factory()->create([
        'npsn' => '20104001',
        'name' => 'SMAN 1 Jakarta',
        'province_id' => $province->id,
        'regency_id' => $regency->id,
        'district_id' => $district->id,
        'latitute' => -6.2485000,
        'longitude' => 106.7995000,
    ]);

    $response = $this->getJson('/api/v1/schools?search=SMAN');

    $response
        ->assertSuccessful()
        ->assertJsonPath('data.0.npsn', '20104001')
        ->assertJsonPath('data.0.name', 'SMAN 1 Jakarta')
        ->assertJsonPath('data.0.province.code', '31')
        ->assertJsonPath('data.0.regency.code', '3171')
        ->assertJsonPath('data.0.district.code', '3171010')
        ->assertJsonPath('data.0.village.code', '3171010001');
});

it('returns school detail by id', function () {
    $province = Province::factory()->create([
        'code' => '32',
        'name' => 'Jawa Barat',
    ]);

    $regency = Regency::factory()->for($province)->create([
        'code' => '3273',
        'name' => 'Kota Bandung',
        'type' => 'kota',
    ]);

    $district = District::factory()->for($regency)->create([
        'code' => '3273010',
        'name' => 'Sukajadi',
    ]);

    $village = Village::factory()->for($district)->create([
        'code' => '3273010001',
        'name' => 'Pasteur',
    ]);

    $school = School::factory()->create([
        'npsn' => '20202002',
        'name' => 'SMPN 2 Bandung',
        'province_id' => $province->id,
        'regency_id' => $regency->id,
        'district_id' => $district->id,
    ]);

    $response = $this->getJson("/api/v1/schools/{$school->id}");

    $response
        ->assertSuccessful()
        ->assertJsonPath('data.npsn', '20202002')
        ->assertJsonPath('data.name', 'SMPN 2 Bandung')
        ->assertJsonPath('data.province.code', '32')
        ->assertJsonPath('data.regency.code', '3273')
        ->assertJsonPath('data.district.code', '3273010')
        ->assertJsonPath('data.village.code', '3273010001');
});

it('validates school pagination parameters', function () {
    $response = $this->getJson('/api/v1/schools?per_page=101');

    $response
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['per_page']);
});

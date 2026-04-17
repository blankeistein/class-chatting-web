<?php

use App\Models\District;
use App\Models\Province;
use App\Models\Regency;
use App\Models\Village;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('returns paginated provinces with regency counts', function () {
    $province = Province::factory()->create([
        'code' => '31',
        'name' => 'DKI Jakarta',
    ]);

    Regency::factory()->count(2)->for($province)->create();

    $response = $this->getJson('/api/v1/regions/provinces');

    $response
        ->assertSuccessful()
        ->assertJsonPath('data.0.code', '31')
        ->assertJsonPath('data.0.regencies_count', 2);
});

it('returns regencies scoped to a province', function () {
    $jakarta = Province::factory()->create([
        'code' => '31',
        'name' => 'DKI Jakarta',
    ]);

    $banten = Province::factory()->create([
        'code' => '36',
        'name' => 'Banten',
    ]);

    Regency::factory()->for($jakarta)->create([
        'code' => '3171',
        'name' => 'Jakarta Selatan',
        'type' => 'kota',
    ]);

    Regency::factory()->for($banten)->create([
        'code' => '3671',
        'name' => 'Kota Tangerang',
        'type' => 'kota',
    ]);

    $response = $this->getJson('/api/v1/regions/provinces/31/regencies');

    $response
        ->assertSuccessful()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.code', '3171')
        ->assertJsonPath('data.0.province.code', '31');
});

it('returns district detail with regency and province context', function () {
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

    Village::factory()->for($district)->create([
        'code' => '3171010001',
        'name' => 'Gandaria Utara',
    ]);

    $response = $this->getJson('/api/v1/regions/districts/3171010');

    $response
        ->assertSuccessful()
        ->assertJsonPath('data.code', '3171010')
        ->assertJsonPath('data.villages_count', 1)
        ->assertJsonPath('data.regency.code', '3171')
        ->assertJsonPath('data.province.code', '31');
});

it('returns villages scoped to a district', function () {
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

    $otherDistrict = District::factory()->for($regency)->create([
        'code' => '3171020',
        'name' => 'Pesanggrahan',
    ]);

    Village::factory()->for($district)->create([
        'code' => '3171010001',
        'name' => 'Gandaria Utara',
    ]);

    Village::factory()->for($otherDistrict)->create([
        'code' => '3171020001',
        'name' => 'Bintaro',
    ]);

    $response = $this->getJson('/api/v1/regions/districts/3171010/villages');

    $response
        ->assertSuccessful()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.code', '3171010001')
        ->assertJsonPath('data.0.district.code', '3171010')
        ->assertJsonPath('data.0.regency.code', '3171')
        ->assertJsonPath('data.0.province.code', '31');
});

it('returns village detail with district, regency, and province context', function () {
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

    Village::factory()->for($district)->create([
        'code' => '3171010001',
        'name' => 'Gandaria Utara',
    ]);

    $response = $this->getJson('/api/v1/regions/villages/3171010001');

    $response
        ->assertSuccessful()
        ->assertJsonPath('data.code', '3171010001')
        ->assertJsonPath('data.district.code', '3171010')
        ->assertJsonPath('data.regency.code', '3171')
        ->assertJsonPath('data.province.code', '31');
});

it('validates region pagination parameters', function () {
    $response = $this->getJson('/api/v1/regions/provinces?per_page=101');

    $response
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['per_page']);
});

it('syncs indonesia regions from a local json file', function () {
    Province::factory()->create([
        'code' => '99',
        'name' => 'Provinsi Lama',
    ]);

    $path = tempnam(sys_get_temp_dir(), 'regions');

    file_put_contents($path, json_encode([
        'provinces' => [
            [
                'code' => '31',
                'name' => 'DKI Jakarta',
                'regencies' => [
                    [
                        'code' => '3171',
                        'name' => 'Jakarta Selatan',
                        'type' => 'kota',
                        'districts' => [
                            [
                                'code' => '3171010',
                                'name' => 'Kebayoran Baru',
                                'villages' => [
                                    [
                                        'code' => '3171010001',
                                        'name' => 'Gandaria Utara',
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ],
    ], JSON_THROW_ON_ERROR));

    $this->artisan('regions:sync', [
        'path' => $path,
        '--prune' => true,
    ])->assertExitCode(0);

    expect(Province::query()->where('code', '31')->exists())->toBeTrue();
    expect(Province::query()->where('code', '99')->exists())->toBeFalse();
    expect(Regency::query()->where('code', '3171')->exists())->toBeTrue();
    expect(District::query()->where('code', '3171010')->exists())->toBeTrue();
    expect(Village::query()->where('code', '3171010001')->exists())->toBeTrue();

    @unlink($path);
});

<?php

namespace Database\Factories;

use App\Models\District;
use App\Models\Province;
use App\Models\Regency;
use App\Models\School;
use App\Models\Village;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<School>
 */
class SchoolFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $province = Province::factory();
        $regency = Regency::factory()->for($province);
        $district = District::factory()->for($regency);
        $village = Village::factory()->for($district);

        return [
            'npsn' => fake()->unique()->numerify('########'),
            'name' => 'Sekolah '.fake()->unique()->company(),
            'bentuk_pendidikan' => fake()->randomElement(['SD', 'SMP', 'SMA', 'SMK', 'TK']),
            'status' => fake()->randomElement(['SWASTA', 'NEGERI']),
            'province_id' => $province,
            'regency_id' => $regency,
            'district_id' => $district,
            'address' => fake()->address(),
            'rt' => fake()->numberBetween(1, 20),
            'rw' => fake()->numberBetween(1, 20),
            'latitute' => fake()->latitude(-11, 6),
            'longitude' => fake()->longitude(95, 141),
        ];
    }
}

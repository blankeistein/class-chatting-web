<?php

namespace Database\Factories;

use App\Models\District;
use App\Models\Regency;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<District>
 */
class DistrictFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'regency_id' => Regency::factory(),
            'code' => str_pad((string) fake()->unique()->numberBetween(1101001, 9999999), 7, '0', STR_PAD_LEFT),
            'name' => 'Kecamatan '.fake()->unique()->citySuffix(),
        ];
    }
}

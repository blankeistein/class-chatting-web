<?php

namespace Database\Factories;

use App\Models\District;
use App\Models\Village;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Village>
 */
class VillageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'district_id' => District::factory(),
            'code' => str_pad((string) fake()->unique()->numberBetween(1101001001, 9999999999), 10, '0', STR_PAD_LEFT),
            'name' => 'Desa '.fake()->unique()->citySuffix(),
        ];
    }
}

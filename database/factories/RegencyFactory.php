<?php

namespace Database\Factories;

use App\Models\Province;
use App\Models\Regency;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Regency>
 */
class RegencyFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'province_id' => Province::factory(),
            'code' => str_pad((string) fake()->unique()->numberBetween(1101, 9999), 4, '0', STR_PAD_LEFT),
            'name' => 'Wilayah '.fake()->unique()->city(),
            'type' => fake()->randomElement(['kabupaten', 'kota']),
        ];
    }
}

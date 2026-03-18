<?php

namespace Database\Factories;

use App\Models\Province;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Province>
 */
class ProvinceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => str_pad((string) fake()->unique()->numberBetween(11, 99), 2, '0', STR_PAD_LEFT),
            'name' => fake()->unique()->state(),
        ];
    }
}

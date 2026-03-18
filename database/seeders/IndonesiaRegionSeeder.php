<?php

namespace Database\Seeders;

use App\Services\Regions\IndonesiaRegionSynchronizer;
use Illuminate\Database\Seeder;

class IndonesiaRegionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        app(IndonesiaRegionSynchronizer::class)->syncFromFile(
            database_path('seeders/indonesia_regions.json'),
            prune: true,
        );
    }
}

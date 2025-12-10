<?php

namespace Database\Seeders;

use App\Models\Video;
use Illuminate\Database\Seeder;

class VideoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🌱 Mulai menanam data Video...');

        for ($i = 1; $i <= 5; $i++) {
            Video::create([
                'title' => "Video Pembahasan Bab $i",
                'slug' => "video-pembahasan-bab-$i",
                'provider' => 'youtube',
                'video_url' => 'https://youtu.be/dummy',
            ]);
        }

        $this->command->info('🌱 Selesai menanam data Video...');
    }
}

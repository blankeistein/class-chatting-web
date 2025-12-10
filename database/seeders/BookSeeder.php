<?php

namespace Database\Seeders;

use App\Models\Book;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class BookSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🌱 Mulai menanam data Book...');

        for ($i = 1; $i <= 5; $i++) {
            Book::create([
                'uuid' => Str::uuid(),
                'title' => "Buku Pelajaran Kelas $i SD",
                'cover_image' => "covers/book-$i.jpg",
            ]);
        }

        $this->command->info('🌱 Selesai menanam data Book...');
    }
}

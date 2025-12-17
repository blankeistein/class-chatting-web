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

        $books = Book::limit(5)->get();

        if ($books->count() > 0) {
            $this->command->info('🌱 Data Book sudah ada...');

            return;
        }

        for ($i = 1; $i <= 5; $i++) {
            Book::create([
                'uuid' => Str::uuid(),
                'title' => "Buku Pelajaran Kelas $i SD",
            ]);
        }

        $this->command->info('🌱 Selesai menanam data Book...');
    }
}

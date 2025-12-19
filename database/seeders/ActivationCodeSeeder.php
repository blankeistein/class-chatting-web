<?php

namespace Database\Seeders;

use App\Enums\ActivationCodeTierEnum;
use App\Models\ActivationCode;
use App\Models\ActivationItem;
use App\Models\Book;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ActivationCodeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🌱 Mulai menanam data Activation Code...');

        $books = Book::limit(5)->get();

        if ($books->count() < 3) {
            $this->command->error('🌱 Data Book tidak cukup untuk menanam data Activation Code...');
            $this->call(BookSeeder::class);
            $books = Book::limit(5)->get();
        }

        $code1 = ActivationCode::create([
            'code' => 'BUKU-SATU',
            'max_activated' => 1,
            'tier' => ActivationCodeTierEnum::PREMIUM,
            'type' => 'single',
        ]);

        ActivationItem::create([
            'activation_code_id' => $code1->id,
            'model_type' => Book::class,
            'model_id' => $books[0]->id,
        ]);

        $code2 = ActivationCode::create([
            'code' => 'PILIH-DONG',
            'max_activated' => 1,
            'tier' => ActivationCodeTierEnum::PREMIUM,
            'type' => 'single',
        ]);

        foreach (array_slice($books->toArray(), 0, 3) as $book) {
            ActivationItem::create([
                'activation_code_id' => $code2->id,
                'model_type' => Book::class,
                'model_id' => $book['id'],
            ]);
        }

        $code3 = ActivationCode::create([
            'code' => 'SUDAH-HANGUS',
            'user_id' => Str::random(20),
            'activated_at' => now(),
            'activated_in' => $books[1]->id,
            'times_activated' => 1,
            'max_activated' => 1,
            'tier' => ActivationCodeTierEnum::PREMIUM,
            'type' => 'single',
        ]);

        ActivationItem::create([
            'activation_code_id' => $code3->id,
            'model_type' => 'book',
            'model_id' => $books[1]->id,
        ]);

        $this->command->info('🌱 Selesai menanam data Activation Code...');
        $this->command->table(
            ['Code', 'Scenario', 'Status'],
            [
                ['BUKU-SATU', 'Unlock Buku 1 saja', 'Available'],
                ['PILIH-DONG', 'Pilih Buku 1, 2, atau 3', 'Available'],
                ['SUDAH-HANGUS', 'Sudah digunakan', 'Used/Error'],
            ]
        );
    }
}

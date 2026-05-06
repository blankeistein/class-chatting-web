<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'firebase_uid' => 'XKZssi4uCXaI1zvvqtklaNSFlCk2',
            'name' => 'Admin',
            'email' => 'admin@lestariilmu.id',
            'username' => 'admin',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'email_verified_at' => now(),
            ]);

        User::create([
            'firebase_uid' => 'tMN7EPFpodhkRO7zA9lCJcV8q9k1',
            'name' => 'Dika',
            'email' => 'dika@lestariilmu.id',
            'username' => 'dika',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);
    }
}

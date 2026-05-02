<?php

use App\Models\Book;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

it('stores a book with type from the admin form', function (): void {
    Storage::fake('public');

    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $response = $this
        ->actingAs($admin)
        ->post(route('admin.books.store'), [
            'title' => 'Buku Matematika',
            'uuid' => 'BOOK-MTK-001',
            'type' => 'materi',
            'tags' => ['kelas-4'],
            'url' => 'https://example.com/books/matematika',
            'version' => 1,
            'cover_url' => UploadedFile::fake()->image('cover-book.jpg'),
        ]);

    $response
        ->assertRedirect(route('admin.books.index'))
        ->assertSessionHas('success');

    $this->assertDatabaseHas('books', [
        'title' => 'Buku Matematika',
        'uuid' => 'BOOK-MTK-001',
        'type' => 'materi',
    ]);
});

it('updates a book type from the admin form', function (): void {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $book = Book::query()->create([
        'title' => 'Buku IPA',
        'uuid' => 'BOOK-IPA-001',
        'type' => 'materi',
        'version' => 1,
    ]);

    $response = $this
        ->actingAs($admin)
        ->put(route('admin.books.update', $book), [
            'title' => 'Buku IPA Semester 2',
            'type' => 'penilaian',
            'tags' => ['semester-2'],
            'url' => 'https://example.com/books/ipa-semester-2',
            'version' => 2,
        ]);

    $response
        ->assertRedirect(route('admin.books.index'))
        ->assertSessionHas('success');

    $this->assertDatabaseHas('books', [
        'id' => $book->id,
        'title' => 'Buku IPA Semester 2',
        'type' => 'penilaian',
        'version' => 2,
    ]);
});

<?php

use App\Models\User;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('stores a youtube video from the admin form', function (): void {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $youtubeUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

    $response = $this
        ->actingAs($admin)
        ->post(route('admin.videos.store'), [
            'title' => 'Video Youtube Admin',
            'description' => 'Disimpan dari form admin.',
            'provider' => 'youtube',
            'yt_url' => $youtubeUrl,
            'tags' => ['edukasi', 'kelas-6'],
        ]);

    $video = Video::query()->first();

    expect($video)->not->toBeNull();

    $response
        ->assertRedirect(route('admin.videos.edit', $video))
        ->assertSessionHas('success');

    expect($video->title)->toBe('Video Youtube Admin');
    expect($video->video_url)->toBe($youtubeUrl);
    expect($video->storage_path)->toBeNull();
    expect($video->provider?->value)->toBe('youtube');
    expect($video->uploaded_by)->toBe($admin->id);
    expect($video->tags)->toBe(['edukasi', 'kelas-6']);
});

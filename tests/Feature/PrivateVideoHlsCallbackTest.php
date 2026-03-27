<?php

use App\Models\User;
use App\Models\Video;

beforeEach(function (): void {
    config()->set('services.private_api.key', 'test-private-key');
});

it('updates the video hls url by slug through the api endpoint', function () {
    if (config('database.default') === 'sqlite' && ! extension_loaded('pdo_sqlite')) {
        $this->markTestSkipped('Skipping database-backed video HLS callback test because the testing environment uses sqlite but pdo_sqlite is not available.');
    }

    $user = User::factory()->create();
    $video = Video::create([
        'title' => 'Video HLS Pending',
        'slug' => 'video-hls-pending',
        'uploaded_by' => $user->id,
        'video_url' => null,
        'storage_path' => 'videos/video-hls-pending/source-video.mp4',
        'provider' => 'firebase',
        'tags' => [],
    ]);

    $response = $this
        ->withHeader('X-API-KEY', 'test-private-key')
        ->postJson('/api/video/update-hls-url', [
            'slug' => $video->slug,
            'video_url' => 'https://firebasestorage.googleapis.com/v0/b/demo-bucket/o/hls%2Fvideo-hls-pending%2Findex.m3u8?alt=media',
        ]);

    $response
        ->assertSuccessful()
        ->assertJsonPath('status', 'success')
        ->assertJsonPath('data.slug', $video->slug)
        ->assertJsonPath('data.storage_path', $video->storage_path)
        ->assertJsonPath('data.video_url', 'https://firebasestorage.googleapis.com/v0/b/demo-bucket/o/hls%2Fvideo-hls-pending%2Findex.m3u8?alt=media');

    expect($video->fresh()?->video_url)
        ->toBe('https://firebasestorage.googleapis.com/v0/b/demo-bucket/o/hls%2Fvideo-hls-pending%2Findex.m3u8?alt=media');
});

it('rejects the video hls callback when the api key is invalid', function () {
    $response = $this
        ->withHeader('X-API-KEY', 'invalid-key')
        ->postJson('/api/video/update-hls-url', [
            'slug' => 'video-hls-pending',
            'video_url' => 'https://firebasestorage.googleapis.com/v0/b/demo-bucket/o/hls%2Fvideo-hls-pending%2Findex.m3u8?alt=media',
        ]);

    $response
        ->assertUnauthorized()
        ->assertJsonPath('message', 'Private API key is invalid.');
});

it('returns not found when no video matches the provided slug', function () {
    if (config('database.default') === 'sqlite' && ! extension_loaded('pdo_sqlite')) {
        $this->markTestSkipped('Skipping database-backed video HLS callback test because the testing environment uses sqlite but pdo_sqlite is not available.');
    }

    $response = $this
        ->withHeader('X-API-KEY', 'test-private-key')
        ->postJson('/api/video/update-hls-url', [
            'slug' => 'missing-video',
            'video_url' => 'https://firebasestorage.googleapis.com/v0/b/demo-bucket/o/hls%2Fmissing-video%2Findex.m3u8?alt=media',
        ]);

    $response
        ->assertNotFound()
        ->assertJsonPath('message', 'Video not found.');
});

it('validates that the callback video url points to an m3u8 file', function () {
    $response = $this
        ->withHeader('X-API-KEY', 'test-private-key')
        ->postJson('/api/video/update-hls-url', [
            'slug' => 'video-hls-pending',
            'video_url' => 'https://firebasestorage.googleapis.com/v0/b/demo-bucket/o/videos%2Fvideo-hls-pending%2Fsource-video.mp4?alt=media',
        ]);

    $response
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['video_url']);
});

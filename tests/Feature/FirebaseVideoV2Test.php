<?php

use App\Enums\ActivationCodeTierEnum;
use App\Models\ActivationCode;
use App\Models\User;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Kreait\Firebase\JWT\Contract\Token as ContractToken;
use Kreait\Laravel\Firebase\Facades\Firebase;

uses(RefreshDatabase::class);

it('tracks a video view for the user identified by the firebase token', function () {
    $user = User::factory()->create([
        'firebase_uid' => 'firebase-video-user',
        'is_active' => true,
    ]);
    $video = Video::query()->create([
        'title' => 'Video Pembelajaran',
        'slug' => 'video-pembelajaran',
        'uploaded_by' => $user->id,
    ]);
    $activationCode = ActivationCode::query()->create([
        'code' => 'VIDEO-AKTIF-001',
        'type' => 'private',
        'tier' => ActivationCodeTierEnum::REGULAR,
        'is_active' => true,
        'activated_at' => now(),
        'user_id' => $user->firebase_uid,
    ]);

    mockVerifiedFirebaseToken('firebase-video-user');

    $response = $this
        ->withHeader('Authorization', 'Bearer valid-firebase-token')
        ->postJson("/api/v2/video/{$video->slug}", [
            'activation_code' => $activationCode->code,
        ]);

    $response
        ->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.video_id', $video->id);

    $this->assertDatabaseHas('video_views', [
        'video_id' => $video->id,
        'user_id' => $user->id,
    ]);
});

it('rejects video views when the firebase user is inactive', function () {
    $user = User::factory()->create([
        'firebase_uid' => 'inactive-firebase-video-user',
        'is_active' => false,
    ]);
    $video = Video::query()->create([
        'title' => 'Video Pembelajaran',
        'slug' => 'video-pembelajaran',
        'uploaded_by' => $user->id,
    ]);

    mockVerifiedFirebaseToken('inactive-firebase-video-user');

    $response = $this
        ->withHeader('Authorization', 'Bearer valid-firebase-token')
        ->postJson("/api/v2/video/{$video->slug}", [
            'activation_code' => 'VIDEO-AKTIF-001',
        ]);

    $response
        ->assertUnauthorized()
        ->assertJsonPath('success', false);

    $this->assertDatabaseCount('video_views', 0);
});

function mockVerifiedFirebaseToken(string $firebaseUid): void
{
    $verifiedToken = Mockery::mock(ContractToken::class);
    $claims = Mockery::mock();
    $claims->shouldReceive('get')->once()->with('sub')->andReturn($firebaseUid);
    $verifiedToken->shouldReceive('claims')->once()->andReturn($claims);

    $auth = Mockery::mock();
    $auth->shouldReceive('verifyIdToken')
        ->once()
        ->with('valid-firebase-token')
        ->andReturn($verifiedToken);

    Firebase::shouldReceive('auth')->once()->andReturn($auth);
}

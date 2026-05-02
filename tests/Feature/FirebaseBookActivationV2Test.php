<?php

use App\Enums\ActivationCodeTierEnum;
use App\Models\ActivationCode;
use App\Models\ActivationItem;
use App\Models\Book;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Kreait\Firebase\Exception\Auth\FailedToVerifyToken;
use Kreait\Firebase\JWT\Contract\Token as ContractToken;
use Kreait\Laravel\Firebase\Facades\Firebase;

uses(RefreshDatabase::class);

it('rejects v2 activation requests without a firebase bearer token', function () {
    $response = $this->postJson('/api/v2/book/activate', [
        'code' => 'AKTIVASI-001',
        'id' => 'book-uuid-001',
        'tier' => ActivationCodeTierEnum::REGULAR->value,
    ]);

    $response
        ->assertUnauthorized()
        ->assertJson([
            'status' => 'error',
            'error_code' => 401,
            'version' => 2,
        ]);
});

it('uses the firebase uid from the verified bearer token instead of the request body', function () {
    $book = Book::query()->create([
        'uuid' => 'book-uuid-001',
        'title' => 'Buku Aktivasi',
    ]);

    $activationCode = ActivationCode::query()->create([
        'code' => 'AKTIVASI-001',
        'type' => 'private',
        'tier' => ActivationCodeTierEnum::REGULAR,
        'is_active' => true,
        'times_activated' => 0,
    ]);

    ActivationItem::query()->create([
        'activation_code_id' => $activationCode->id,
        'model_type' => 'book',
        'model_id' => $book->id,
    ]);

    $verifiedToken = Mockery::mock(ContractToken::class);
    $claims = Mockery::mock();
    $claims->shouldReceive('get')->once()->with('sub')->andReturn('firebase-user-from-token');
    $verifiedToken->shouldReceive('claims')->once()->andReturn($claims);

    $auth = Mockery::mock();
    $auth->shouldReceive('verifyIdToken')->once()->with('valid-firebase-token')->andReturn($verifiedToken);

    Firebase::shouldReceive('auth')->once()->andReturn($auth);

    $response = $this
        ->withHeader('Authorization', 'Bearer valid-firebase-token')
        ->postJson('/api/v2/book/activate', [
            'code' => 'AKTIVASI-001',
            'uid' => 'forged-user-id',
            'id' => 'book-uuid-001',
            'tier' => ActivationCodeTierEnum::REGULAR->value,
        ]);

    $response
        ->assertOk()
        ->assertJson([
            'status' => 'success',
            'version' => 2,
        ]);

    expect($activationCode->fresh())
        ->user_id->toBe('firebase-user-from-token');
});

it('rejects v2 activation requests with an invalid firebase bearer token', function () {
    $auth = Mockery::mock();
    $auth->shouldReceive('verifyIdToken')
        ->once()
        ->with('invalid-firebase-token')
        ->andThrow(new FailedToVerifyToken('Invalid token'));

    Firebase::shouldReceive('auth')->once()->andReturn($auth);

    $response = $this
        ->withHeader('Authorization', 'Bearer invalid-firebase-token')
        ->postJson('/api/v2/book/activate', [
            'code' => 'AKTIVASI-001',
            'id' => 'book-uuid-001',
            'tier' => ActivationCodeTierEnum::REGULAR->value,
        ]);

    $response
        ->assertUnauthorized()
        ->assertJson([
            'status' => 'error',
            'error_code' => 401,
            'version' => 2,
        ]);
});

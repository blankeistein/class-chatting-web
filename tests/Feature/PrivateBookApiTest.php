<?php

use App\Http\Controllers\API\BookController;
use Illuminate\Http\JsonResponse;

beforeEach(function (): void {
    config()->set('services.private_api.key', 'test-private-key');
});

it('returns not found when private book api key is missing from the url', function () {
    $response = $this->getJson('/api/private-api/book');

    $response->assertNotFound();
});

it('rejects private book api requests with an invalid api key in the url', function () {
    $response = $this->getJson('/api/private-api/invalid-key/book');

    $response
        ->assertUnauthorized()
        ->assertJsonPath('message', 'Private API key is invalid.');
});

it('allows private book api requests with a valid api key in the url', function () {
    app()->bind(BookController::class, fn () => new class
    {
        public function index(): JsonResponse
        {
            return response()->json([
                'data' => [
                    [
                        'uuid' => 'book-uuid-1',
                        'title' => 'Buku Private 1',
                        'tags' => ['kelas', 'lokal'],
                        'version' => 2,
                    ],
                ],
            ]);
        }
    });

    $response = $this->getJson('/api/private-api/test-private-key/book');

    $response
        ->assertSuccessful()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.uuid', 'book-uuid-1')
        ->assertJsonPath('data.0.title', 'Buku Private 1')
        ->assertJsonPath('data.0.tags.0', 'kelas')
        ->assertJsonPath('data.0.version', 2);
});

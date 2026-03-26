<?php

use Symfony\Component\Process\Process;

it('stores a machine readable openapi document for ai tooling', function () {
    $path = base_path('openapi.json');

    expect(file_exists($path))->toBeTrue();

    $document = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);

    expect($document['info']['title'])->toBe('Class Chatting API')
        ->and($document['paths'])->toHaveKeys([
            '/v1/book/activate',
            '/v1/regions/provinces',
            '/firebase/webhook/user-created',
            '/private-api/{api_key}/book',
            '/private-api/{api_key}/video/list',
        ]);
});

it('can regenerate the openapi document with scramble', function () {
    if (config('database.default') === 'sqlite' && ! extension_loaded('pdo_sqlite')) {
        $this->markTestSkipped('Skipping regeneration check because the testing environment uses sqlite but pdo_sqlite is not available.');
    }

    $path = storage_path('app/testing-openapi.json');

    if (file_exists($path)) {
        unlink($path);
    }

    $process = new Process([
        PHP_BINARY,
        'artisan',
        'scramble:export',
        '--path='.$path,
        '--env=local',
    ], base_path());

    $process->setTimeout(60);
    $process->run();

    expect($process->isSuccessful())->toBeTrue($process->getErrorOutput().$process->getOutput());

    $document = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);

    expect($document['info']['description'])->toContain('OpenAPI 3.1');

    unlink($path);
});

<?php

it('rejects search with less than 3 characters', function () {
    $response = $this->getJson('/api/v1/regions/provinces?search=ja');

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['search']);
});

it('rejects search with 1 character', function () {
    $response = $this->getJson('/api/v1/regions/provinces?search=j');

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['search']);
});

it('rejects search with 2 characters', function () {
    $response = $this->getJson('/api/v1/regions/provinces?search=ja');

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['search']);
});

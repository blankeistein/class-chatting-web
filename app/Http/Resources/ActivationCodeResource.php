<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivationCodeResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'user' => $this->user ? [
                'name' => $this->user->name,
                'email' => $this->user->email,
            ] : null,
            'activated_at' => $this->activated_at,
            'activated_in' => $this->activated_in,
            'tier' => [
                'value' => $this->tier->value,
                'label' => $this->tier->label(),
            ],
            'type' => $this->type,
            'times_activated' => $this->times_activated,
            'max_activated' => $this->max_activated,
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}

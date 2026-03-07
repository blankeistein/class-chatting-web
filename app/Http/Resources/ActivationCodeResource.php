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
            'is_active' => $this->is_active,
            'items' => $this->items->map(fn ($item) => [
                'id' => $item->id,
                'model_id' => $item->model_id,
                'model_type' => $item->model_type,
                'model' => $item->model ? [
                    'id' => $item->model->id,
                    'uuid' => $item->model->uuid,
                    'title' => $item->model->title,
                ] : null,
            ]),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}

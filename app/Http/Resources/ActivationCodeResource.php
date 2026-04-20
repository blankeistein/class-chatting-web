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
            'activatedAt' => $this->activated_at,
            'activatedIn' => $this->activatedIn ? [
                'id' => $this->activatedIn->id,
                'name' => $this->activatedIn->model->title,
                'type' => $this->activatedIn->model_type,
            ] : null,
            'tier' => [
                'value' => $this->tier->value,
                'label' => $this->tier->label(),
            ],
            'type' => $this->type,
            'timesActivated' => $this->times_activated,
            'maxActivated' => $this->max_activated,
            'isActive' => $this->is_active,
            'items' => $this->items->map(fn ($item) => [
                'id' => $item->id,
                'modelId' => $item->model_id,
                'modelType' => $item->model_type,
                'model' => $item->model ? [
                    'id' => $item->model->id,
                    'uuid' => $item->model->uuid,
                    'title' => $item->model->title,
                ] : null,
            ]),
            'createdAt' => $this->created_at->toIso8601String(),
            'updatedAt' => $this->updated_at->toIso8601String(),
        ];
    }
}

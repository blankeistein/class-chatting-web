<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RegencyResource extends JsonResource
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
            'name' => $this->name,
            'type' => $this->type,
            'districtsCount' => $this->whenCounted('districts'),
            'villagesCount' => $this->whenCounted('villages'),
            'province' => $this->whenLoaded('province', function (): array {
                return [
                    'id' => $this->province->id,
                    'code' => $this->province->code,
                    'name' => $this->province->name,
                ];
            }),
        ];
    }
}

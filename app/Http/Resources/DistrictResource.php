<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DistrictResource extends JsonResource
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
            'villagesCount' => $this->whenCounted('villages'),
            'regency' => $this->whenLoaded('regency', function (): array {
                return [
                    'id' => $this->regency->id,
                    'code' => $this->regency->code,
                    'name' => $this->regency->name,
                    'type' => $this->regency->type,
                ];
            }),
            'province' => $this->when(
                $this->relationLoaded('regency')
                    && $this->regency !== null
                    && $this->regency->relationLoaded('province')
                    && $this->regency->province !== null,
                function (): array {
                    return [
                        'id' => $this->regency->province->id,
                        'code' => $this->regency->province->code,
                        'name' => $this->regency->province->name,
                    ];
                }
            ),
        ];
    }
}

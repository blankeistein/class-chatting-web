<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VillageResource extends JsonResource
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
            'district' => $this->whenLoaded('district', function (): array {
                return [
                    'id' => $this->district->id,
                    'code' => $this->district->code,
                    'name' => $this->district->name,
                ];
            }),
            'regency' => $this->when(
                $this->relationLoaded('district')
                    && $this->district !== null
                    && $this->district->relationLoaded('regency')
                    && $this->district->regency !== null,
                function (): array {
                    return [
                        'id' => $this->district->regency->id,
                        'code' => $this->district->regency->code,
                        'name' => $this->district->regency->name,
                        'type' => $this->district->regency->type,
                    ];
                }
            ),
            'province' => $this->when(
                $this->relationLoaded('district')
                    && $this->district !== null
                    && $this->district->relationLoaded('regency')
                    && $this->district->regency !== null
                    && $this->district->regency->relationLoaded('province')
                    && $this->district->regency->province !== null,
                function (): array {
                    return [
                        'id' => $this->district->regency->province->id,
                        'code' => $this->district->regency->province->code,
                        'name' => $this->district->regency->province->name,
                    ];
                }
            ),
        ];
    }
}

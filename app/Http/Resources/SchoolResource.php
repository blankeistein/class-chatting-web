<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SchoolResource extends JsonResource
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
            'old_code' => $this->old_code,
            'npsn' => $this->npsn,
            'name' => $this->name,
            'bentuk_pendidikan' => $this->bentuk_pendidikan,
            'status' => $this->status,
            'address' => $this->address,
            'rt' => $this->rt,
            'rw' => $this->rw,
            'latitute' => $this->latitute,
            'longitude' => $this->longitude,
            'province' => $this->whenLoaded('province', function (): array {
                return [
                    'id' => $this->province->id,
                    'code' => $this->province->code,
                    'name' => $this->province->name,
                ];
            }),
            'regency' => $this->whenLoaded('regency', function (): array {
                return [
                    'id' => $this->regency->id,
                    'code' => $this->regency->code,
                    'name' => $this->regency->name,
                    'type' => $this->regency->type,
                ];
            }),
            'district' => $this->whenLoaded('district', function (): array {
                return [
                    'id' => $this->district->id,
                    'code' => $this->district->code,
                    'name' => $this->district->name,
                ];
            }),
            'village' => $this->whenLoaded('village', function (): array {
                return [
                    'id' => $this->village->id,
                    'code' => $this->village->code,
                    'name' => $this->village->name,
                ];
            }),
        ];
    }
}

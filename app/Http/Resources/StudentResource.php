<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * Name is always sourced from the related user (not stored on students).
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'school_id' => $this->school_id,
            'name' => $this->whenLoaded('user', fn () => $this->user?->name),
            'nis' => $this->nis,
            'nisn' => $this->nisn,
            'class_name' => $this->class_name,
            'gender' => $this->gender,
            'is_active' => (bool) $this->is_active,
            'user' => $this->whenLoaded('user', function (): array {
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email,
                    'username' => $this->user->username,
                    'role' => $this->user->role?->value ?? $this->user->role,
                    'is_active' => (bool) $this->user->is_active,
                    'avatar' => $this->user->image,
                ];
            }),
            'school' => $this->whenLoaded('school', function (): array {
                return [
                    'id' => $this->school->id,
                    'code' => $this->school->code,
                    'npsn' => $this->school->npsn,
                    'name' => $this->school->name,
                ];
            }),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}

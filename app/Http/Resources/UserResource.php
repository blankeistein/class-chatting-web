<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
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
            'firebase_uid' => $this->firebase_uid,
            'name' => $this->name,
            'username' => $this->username,
            'email' => $this->email,
            'phone' => $this->phone,
            'avatar' => $this->image,
            'role' => $this->role?->value ?? $this->role,
            'is_active' => (bool) $this->is_active,
            'schoolId' => $this->whenLoaded('student', fn () => $this->student?->school_id),
            'school' => $this->when(
                $this->relationLoaded('student') && $this->student?->relationLoaded('school') && $this->student->school,
                function (): array {
                    $school = $this->student->school;

                    return [
                        'id' => $school->id,
                        'code' => $school->code,
                        'npsn' => $school->npsn,
                        'name' => $school->name,
                    ];
                }
            ),
            'email_verified_at' => $this->email_verified_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}

<?php

namespace App\Http\Resources;

use App\Enums\AppEnum;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $integrationKeys = $this->relationLoaded('integrations')
            ? $this->integrations->pluck('app_key')->all()
            : [];

        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'title' => $this->title,
            'type' => $this->type,
            'coverUrl' => $this->thumbnail,
            'tags' => $this->tags,
            'url' => $this->url,
            'version' => $this->version,
            'applications' => array_values(array_filter(
                array_map(
                    static fn (AppEnum $app): ?array => in_array($app->value, $integrationKeys, true)
                        ? [
                            'key' => $app->value,
                            'label' => $app->label(),
                        ]
                        : null,
                    AppEnum::cases(),
                )
            )),
            'createdAt' => $this->created_at->toIso8601String(),
            'updatedAt' => $this->updated_at->toIso8601String(),
        ];
    }
}

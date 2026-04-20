<?php

namespace App\Models;

use Database\Factories\VillageFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Village extends Model
{
    /** @use HasFactory<VillageFactory> */
    use HasFactory;

    protected $fillable = [
        'district_id',
        'code',
        'name',
    ];

    public function getRouteKeyName(): string
    {
        return 'code';
    }

    public function district(): BelongsTo
    {
        return $this->belongsTo(District::class);
    }

    public function schools(): HasMany
    {
        return $this->hasMany(School::class);
    }

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        $search = trim((string) $search);

        if ($search === '') {
            return $query;
        }

        return $query->where(function (Builder $builder) use ($search): void {
            $builder
                ->where('code', 'like', "%{$search}%")
                ->orWhere('name', 'like', "%{$search}%");
        });
    }
}

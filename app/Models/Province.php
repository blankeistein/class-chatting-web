<?php

namespace App\Models;

use Database\Factories\ProvinceFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Province extends Model
{
    /** @use HasFactory<ProvinceFactory> */
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
    ];

    public function getRouteKeyName(): string
    {
        return 'code';
    }

    public function regencies(): HasMany
    {
        return $this->hasMany(Regency::class);
    }

    public function districts(): HasManyThrough
    {
        return $this->hasManyThrough(District::class, Regency::class);
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

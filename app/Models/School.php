<?php

namespace App\Models;

use Database\Factories\SchoolFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class School extends Model
{
    /** @use HasFactory<SchoolFactory> */
    use HasFactory;

    protected $fillable = [
        'code',
        'old_code',
        'npsn',
        'name',
        'bentuk_pendidikan',
        'status',
        'province_id',
        'regency_id',
        'district_id',
        'address',
        'rt',
        'rw',
        'latitute',
        'longitude',
    ];

    public function getRouteKeyName(): string
    {
        return 'code';
    }

    public function province(): BelongsTo
    {
        return $this->belongsTo(Province::class);
    }

    public function regency(): BelongsTo
    {
        return $this->belongsTo(Regency::class);
    }

    public function district(): BelongsTo
    {
        return $this->belongsTo(District::class);
    }

    public function village(): BelongsTo
    {
        return $this->belongsTo(Village::class);
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
                ->where('npsn', 'like', "%{$search}%")
                ->orWhere('name', 'like', "%{$search}%");
        });
    }
}

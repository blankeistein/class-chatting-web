<?php

namespace App\Models;

use App\Enums\ActivationCodeTierEnum;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ActivationCode extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'code',
        'user_id',
        'type',
        'activated_at',
        'activated_in',
        'tier',
        'times_activated',
        'max_activated',
        'is_active',
    ];

    protected $casts = [
        'tier' => ActivationCodeTierEnum::class,
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'firebase_uid');
    }

    public function items(): HasMany
    {
        return $this->hasMany(ActivationItem::class);
    }
}

<?php

namespace App\Models;

use App\Enums\ActivationCodeTierEnum;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ActivationCode extends Model
{
    protected $fillable = [
        'code',
        'user_id',
        'type',
        'activated_at',
        'activated_in',
        'tier',
        'times_activated',
        'max_activated',
    ];

    protected $casts = [
        'tier' => ActivationCodeTierEnum::class,
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

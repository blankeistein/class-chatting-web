<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ActivationItem extends Model
{
    protected $guarded = ['id'];

    public function activationCode(): BelongsTo
    {
        return $this->belongsTo(ActivationCode::class);
    }

    public function model(): MorphTo
    {
        return $this->morphTo();
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookIntegration extends Model
{
    protected $fillable = [
        'book_id',
        'app_key',
    ];

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }
}

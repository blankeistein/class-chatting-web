<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('activation_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activation_code_id')->constrained()->cascadeOnDelete();
            $table->morphs('model');

            $table->unique(['activation_code_id', 'model_id', 'model_type'], 'activation_items_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activation_items');
    }
};

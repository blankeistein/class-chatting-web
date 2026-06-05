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
        // Add indexes to activation_codes table
        Schema::table('activation_codes', function (Blueprint $table) {
            $table->index('is_active', 'activation_codes_is_active_index');
            $table->index(['is_active', 'code'], 'activation_codes_is_active_code_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop indexes from activation_codes table
        Schema::table('activation_codes', function (Blueprint $table) {
            $table->dropIndex('activation_codes_is_active_index');
            $table->dropIndex('activation_codes_is_active_code_index');
        });
    }
};

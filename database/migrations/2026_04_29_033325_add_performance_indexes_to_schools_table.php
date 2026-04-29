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
        Schema::table('schools', function (Blueprint $table) {
            // Add index for created_at (default sorting)
            $table->index('created_at', 'schools_created_at_index');

            // Add composite index for common search patterns
            $table->index(['status', 'bentuk_pendidikan'], 'schools_status_bentuk_index');

            // Add index for npsn search
            $table->index('npsn', 'schools_npsn_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->dropIndex('schools_created_at_index');
            $table->dropIndex('schools_status_bentuk_index');
            $table->dropIndex('schools_npsn_index');
        });
    }
};

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
        Schema::create('schools', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('npsn', 20)->nullable()->unique();
            $table->string('name');
            $table->string('bentuk_pendidikan', 100);
            $table->string('status', 20);
            $table->foreignId('province_id')->constrained()->cascadeOnDelete();
            $table->foreignId('regency_id')->constrained()->cascadeOnDelete();
            $table->foreignId('district_id')->constrained()->cascadeOnDelete();
            $table->text('address')->nullable();
            $table->unsignedInteger('rt')->nullable();
            $table->unsignedInteger('rw')->nullable();
            $table->decimal('latitute', 10, 8)->nullable();
            $table->decimal('longitude', 10, 8)->nullable();
            $table->string('old_code', 50)->nullable()->default(null);
            $table->timestamps();

            $table->index('name');
            $table->index('bentuk_pendidikan');
            $table->index('status');
            $table->index(['province_id', 'regency_id', 'district_id', 'code'], 'schools_region_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schools');
    }
};

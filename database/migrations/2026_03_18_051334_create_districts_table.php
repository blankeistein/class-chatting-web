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
        if (! Schema::hasTable('districts')) {
            Schema::create('districts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('regency_id')->constrained()->cascadeOnDelete();
                $table->string('code', 10)->unique();
                $table->string('name');
                $table->timestamps();

                $table->index(['regency_id', 'name']);
            });

            return;
        }

        Schema::table('districts', function (Blueprint $table) {
            if (! Schema::hasColumn('districts', 'regency_id')) {
                $table->foreignId('regency_id')->after('id')->constrained()->cascadeOnDelete();
            }

            if (! Schema::hasColumn('districts', 'code')) {
                $table->string('code', 10)->after('regency_id');
            }

            if (! Schema::hasColumn('districts', 'name')) {
                $table->string('name')->after('code');
            }
        });

        Schema::table('districts', function (Blueprint $table) {
            $table->unique('code');
            $table->index(['regency_id', 'name']);
            $table->foreign('regency_id')->references('id')->on('regencies')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('districts');
    }
};

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
        Schema::create('activation_codes', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique()->collation('utf8mb4_bin');
            $table->string('user_id')->nullable();
            $table->timestamp('activated_at')->nullable();
            $table->foreignId('activated_in')->nullable();
            $table->smallInteger('tier')->default(0);
            $table->integer('times_activated')->default(0);
            $table->integer('max_activated')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activation_codes');
    }
};

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
        // Add indexes to users table
        Schema::table('users', function (Blueprint $table) {
            $table->index('firebase_uid', 'users_firebase_uid_index');
            $table->index('username', 'users_username_index');
            $table->index('role', 'users_role_index');
            $table->index('is_active', 'users_is_active_index');
            $table->index(['role', 'is_active'], 'users_role_is_active_index');
        });

        // Add indexes to books table
        Schema::table('books', function (Blueprint $table) {
            $table->index('uuid', 'books_uuid_index');
            $table->index('type', 'books_type_index');
        });

        // Add indexes to activation_codes table
        Schema::table('activation_codes', function (Blueprint $table) {
            $table->index('code', 'activation_codes_code_index');
            $table->index('user_id', 'activation_codes_user_id_index');
            $table->index('is_active', 'activation_codes_is_active_index');
            $table->index(['is_active', 'code'], 'activation_codes_is_active_code_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop indexes from users table
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_firebase_uid_index');
            $table->dropIndex('users_username_index');
            $table->dropIndex('users_role_index');
            $table->dropIndex('users_is_active_index');
            $table->dropIndex('users_role_is_active_index');
        });

        // Drop indexes from books table
        Schema::table('books', function (Blueprint $table) {
            $table->dropIndex('books_uuid_index');
            $table->dropIndex('books_type_index');
        });

        // Drop indexes from activation_codes table
        Schema::table('activation_codes', function (Blueprint $table) {
            $table->dropIndex('activation_codes_code_index');
            $table->dropIndex('activation_codes_user_id_index');
            $table->dropIndex('activation_codes_is_active_index');
            $table->dropIndex('activation_codes_is_active_code_index');
        });
    }
};

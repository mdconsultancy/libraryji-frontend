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
        Schema::create('refresh_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // SHA-256 hash of the plaintext refresh token — the plaintext is
            // only ever seen once, at issuance, same principle as a password.
            $table->string('token_hash')->unique();
            $table->timestamp('expires_at');
            // Set the moment the token is used to mint a new pair (rotation)
            // or the user logs out — a revoked or expired row can never be
            // redeemed again, even if the plaintext leaks afterward.
            $table->timestamp('revoked_at')->nullable();
            $table->string('user_agent')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('refresh_tokens');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('phone');
            $table->string('whatsapp_number')->nullable();
            $table->enum('status', ['new', 'contacted', 'converted', 'lost'])->default('new');
            $table->text('notes')->nullable();
            // Set once the Convert action successfully creates a Member from
            // this lead — kept even if the member is later deleted, so the
            // lead's history stays intact.
            $table->foreignId('converted_member_id')->nullable()->constrained('members')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->string('whatsapp_number')->nullable()->after('phone');
            $table->string('id_proof_front_path')->nullable()->after('id_proof_path');
            $table->string('id_proof_back_path')->nullable()->after('id_proof_front_path');
        });
    }

    public function down(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->dropColumn(['whatsapp_number', 'id_proof_front_path', 'id_proof_back_path']);
        });
    }
};

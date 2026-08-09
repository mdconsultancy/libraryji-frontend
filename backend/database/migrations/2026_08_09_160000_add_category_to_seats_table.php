<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Regular = a fixed seat assigned to one member for their whole subscription.
// Rotation = a shared seat multiple members rotate through across shifts —
// the Add Member wizard's seat picker groups by this, not by seat_type.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('seats', function (Blueprint $table) {
            $table->enum('category', ['regular', 'rotation'])->default('regular')->after('seat_type');
        });
    }

    public function down(): void
    {
        Schema::table('seats', function (Blueprint $table) {
            $table->dropColumn('category');
        });
    }
};

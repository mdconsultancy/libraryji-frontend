<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Seats, members & staff are unlimited on every plan now (see PlanLimitService::UNLIMITED_RESOURCES),
// so these columns are legacy/unused — kept nullable instead of dropped in case limits come back per-plan.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table) {
            $table->unsignedInteger('max_seats')->nullable()->default(null)->change();
            $table->unsignedInteger('max_members')->nullable()->default(null)->change();
            $table->unsignedInteger('max_staff')->nullable()->default(null)->change();
        });
    }

    public function down(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table) {
            $table->unsignedInteger('max_seats')->default(50)->change();
            $table->unsignedInteger('max_members')->default(100)->change();
            $table->unsignedInteger('max_staff')->default(3)->change();
        });
    }
};

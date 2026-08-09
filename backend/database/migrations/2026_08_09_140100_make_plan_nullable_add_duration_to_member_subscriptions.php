<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Lets the Add Member wizard assign a subscription by picking a duration in
// months directly (no membership_plan_id) instead of requiring an admin to
// have pre-configured a matching plan.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('member_subscriptions', function (Blueprint $table) {
            $table->foreignId('membership_plan_id')->nullable()->change();
            $table->unsignedSmallInteger('duration_months')->nullable()->after('membership_plan_id');
        });
    }

    public function down(): void
    {
        Schema::table('member_subscriptions', function (Blueprint $table) {
            $table->dropColumn('duration_months');
            $table->foreignId('membership_plan_id')->nullable(false)->change();
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * How many total Libraries a plan entitles its admin's account to
     * operate ("best active plan wins" — an admin's overall limit is the
     * highest max_libraries among all their currently active
     * subscriptions, computed in UserController::librariesSummary).
     * NULL means unlimited. Existing plans default to 1 (their current,
     * pre-this-feature single Library) so nothing changes for anyone
     * already on a plan until it's explicitly raised.
     */
    public function up(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table) {
            $table->unsignedInteger('max_libraries')->nullable()->default(1)->after('max_staff');
        });
    }

    public function down(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table) {
            $table->dropColumn('max_libraries');
        });
    }
};

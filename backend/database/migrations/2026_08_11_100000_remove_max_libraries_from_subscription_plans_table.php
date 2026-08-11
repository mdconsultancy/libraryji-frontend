<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('subscription_plans', 'max_libraries')) {
            Schema::table('subscription_plans', function (Blueprint $table) {
                $table->dropColumn('max_libraries');
            });
        }
    }

    public function down(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table) {
            $table->unsignedInteger('max_libraries')->nullable()->default(1)->after('max_staff');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('library_code')->nullable()->unique()->after('slug');
            $table->unsignedSmallInteger('established_year')->nullable()->after('library_code');
            $table->string('alternate_phone')->nullable()->after('phone');
            $table->text('address')->nullable()->after('alternate_phone');
            $table->string('city')->nullable()->after('address');
            $table->string('state')->nullable()->after('city');
            $table->string('country')->default('India')->after('state');
            $table->string('pincode')->nullable()->after('country');
            $table->string('gst_number')->nullable()->after('pincode');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn([
                'library_code', 'established_year', 'alternate_phone', 'address',
                'city', 'state', 'country', 'pincode', 'gst_number',
            ]);
        });
    }
};

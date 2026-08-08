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
        // DB-level backstop against the idempotency check in
        // PlanSelectionController::verify() — a unique index means even a
        // genuine race (two concurrent verify requests for the same order)
        // can't create two subscription rows for one payment. Nullable
        // columns allow multiple NULLs under a unique index in MySQL, so
        // subscriptions created without a Razorpay order (manual
        // super-admin creation) are unaffected.
        Schema::table('tenant_subscriptions', function (Blueprint $table) {
            $table->unique('razorpay_order_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenant_subscriptions', function (Blueprint $table) {
            $table->dropUnique(['razorpay_order_id']);
        });
    }
};

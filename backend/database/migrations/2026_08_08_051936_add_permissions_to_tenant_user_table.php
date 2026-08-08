<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Per-Library, per-staff granular module permissions (view/add/edit/delete
     * for library/halls/members/payments). Admin/super_admin rows never read
     * this — they always pass every check — so it's only meaningful on
     * role=staff rows. Existing staff rows are backfilled with full access
     * to all four modules so nobody already in the system loses access the
     * moment enforcement starts.
     */
    public function up(): void
    {
        Schema::table('tenant_user', function (Blueprint $table) {
            $table->json('permissions')->nullable()->after('role');
        });

        $fullAccess = json_encode([
            'library' => ['view' => true, 'edit' => true],
            'halls' => ['view' => true, 'add' => true, 'edit' => true, 'delete' => true],
            'members' => ['view' => true, 'add' => true, 'edit' => true, 'delete' => true],
            'payments' => ['view' => true, 'add' => true, 'edit' => true, 'delete' => true],
        ]);

        DB::table('tenant_user')->where('role', 'staff')->update(['permissions' => $fullAccess]);
    }

    public function down(): void
    {
        Schema::table('tenant_user', function (Blueprint $table) {
            $table->dropColumn('permissions');
        });
    }
};

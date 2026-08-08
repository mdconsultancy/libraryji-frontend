<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * `users.tenant_id` used to mean "the one Library this account belongs
     * to". Under the multi-Library model that's no longer true for admins,
     * so it's replaced by `current_tenant_id` — the Library workspace the
     * user currently has selected — while actual membership/role-per-Library
     * moves to `tenant_user`. Every existing user's single `tenant_id` is
     * preserved as both their initial `current_tenant_id` and their one
     * `tenant_user` row, so no access changes for anyone already in the system.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('current_tenant_id')->nullable()->after('tenant_id')->constrained('tenants')->nullOnDelete();
        });

        DB::table('users')->whereNotNull('tenant_id')->orderBy('id')->each(function ($user) {
            DB::table('users')->where('id', $user->id)->update(['current_tenant_id' => $user->tenant_id]);

            DB::table('tenant_user')->updateOrInsert(
                ['tenant_id' => $user->tenant_id, 'user_id' => $user->id],
                [
                    'role' => in_array($user->role, ['admin', 'staff'], true) ? $user->role : 'staff',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('tenant_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->nullOnDelete();
        });

        DB::table('users')->whereNotNull('current_tenant_id')->orderBy('id')->each(function ($user) {
            DB::table('users')->where('id', $user->id)->update(['tenant_id' => $user->current_tenant_id]);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('current_tenant_id');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * `users.email` / `tenants.email` are soft-deleted (via deleted_at), but a
     * plain UNIQUE index has no idea about that — it's enforced by MySQL/MariaDB
     * directly against the raw column, so a soft-deleted row still blocks a new
     * INSERT reusing its email even though every application-level uniqueness
     * check (Rule::unique()->whereNull('deleted_at'), Eloquent's own global
     * scope) correctly treats that email as free. MySQL/MariaDB has no partial
     * unique index, so we fake one: a virtual column that collapses to NULL
     * once a row is trashed, and the unique index moves onto that instead.
     * NULL is never considered a duplicate by a unique index, so any number of
     * trashed rows can share an old email while active rows stay unique.
     */
    public function up(): void
    {
        DB::statement('ALTER TABLE users DROP INDEX users_email_unique');
        DB::statement("ALTER TABLE users ADD COLUMN email_active VARCHAR(255) GENERATED ALWAYS AS (CASE WHEN deleted_at IS NULL THEN email ELSE NULL END) VIRTUAL");
        DB::statement('ALTER TABLE users ADD UNIQUE INDEX users_email_active_unique (email_active)');

        DB::statement('ALTER TABLE tenants DROP INDEX tenants_email_unique');
        DB::statement("ALTER TABLE tenants ADD COLUMN email_active VARCHAR(255) GENERATED ALWAYS AS (CASE WHEN deleted_at IS NULL THEN email ELSE NULL END) VIRTUAL");
        DB::statement('ALTER TABLE tenants ADD UNIQUE INDEX tenants_email_active_unique (email_active)');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE users DROP INDEX users_email_active_unique');
        DB::statement('ALTER TABLE users DROP COLUMN email_active');
        DB::statement('ALTER TABLE users ADD UNIQUE INDEX users_email_unique (email)');

        DB::statement('ALTER TABLE tenants DROP INDEX tenants_email_active_unique');
        DB::statement('ALTER TABLE tenants DROP COLUMN email_active');
        DB::statement('ALTER TABLE tenants ADD UNIQUE INDEX tenants_email_unique (email)');
    }
};

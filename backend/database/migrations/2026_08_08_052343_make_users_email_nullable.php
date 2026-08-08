<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Staff creation now treats email as optional (name + password are the
     * only required fields). `email_active` (see the earlier
     * scope_email_unique_indexes_to_active_rows migration) already computes
     * NULL for any non-active row, and a unique index never treats two NULLs
     * as duplicates, so multiple email-less staff rows coexist safely.
     * Plain `$table->string()->nullable()->change()` would need
     * doctrine/dbal (not installed here), so this uses a raw MODIFY —
     * same approach the email_active migration already established.
     */
    public function up(): void
    {
        DB::statement('ALTER TABLE users MODIFY email VARCHAR(255) NULL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE users MODIFY email VARCHAR(255) NOT NULL');
    }
};

<?php

namespace App\Services;

use App\Models\Member;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

/**
 * Estimates, per tenant (Library), how much of the platform's shared
 * resources it's actually using — for the SuperAdmin User Management pages.
 *
 * There's no per-tenant database, so "DB storage" can't be read directly
 * from MySQL; it's estimated from `information_schema` per-table
 * avg_row_length (cheap: one query per table, not per row) multiplied by how
 * many of that table's rows belong to the tenant. "Media storage" sums the
 * actual on-disk size of every file the tenant owns (tenant logo + each
 * member's photo/ID proof uploads) since there's no cached size column.
 */
class StorageUsageService
{
    private const TENANT_SCOPED_TABLES = [
        'members', 'member_subscriptions', 'membership_plans', 'seats', 'halls',
        'shifts', 'payments', 'expenses', 'attendances', 'leads', 'audit_logs',
        'tenant_subscriptions',
    ];

    private const MEMBER_FILE_COLUMNS = ['photo_path', 'id_proof_path', 'id_proof_front_path', 'id_proof_back_path'];

    public function databaseUsageBytes(Tenant $tenant): int
    {
        $database = DB::connection()->getDatabaseName();
        $total = 0;

        foreach (self::TENANT_SCOPED_TABLES as $table) {
            if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'tenant_id')) {
                continue;
            }

            $rowCount = DB::table($table)->where('tenant_id', $tenant->id)->count();
            if ($rowCount === 0) {
                continue;
            }

            $avgRowLength = DB::table('information_schema.tables')
                ->where('table_schema', $database)
                ->where('table_name', $table)
                ->value('avg_row_length');

            $total += (int) $avgRowLength * $rowCount;
        }

        return $total;
    }

    public function mediaUsageBytes(Tenant $tenant): int
    {
        $bytes = 0;

        if ($tenant->logo_path && Storage::disk('public')->exists($tenant->logo_path)) {
            $bytes += Storage::disk('public')->size($tenant->logo_path);
        }

        $paths = Member::where('tenant_id', $tenant->id)
            ->get(self::MEMBER_FILE_COLUMNS)
            ->flatMap(fn (Member $member) => array_map(fn ($column) => $member->{$column}, self::MEMBER_FILE_COLUMNS))
            ->filter();

        foreach ($paths as $path) {
            if (Storage::disk('local')->exists($path)) {
                $bytes += Storage::disk('local')->size($path);
            }
        }

        return $bytes;
    }

    /**
     * @return array{db_bytes: int, media_bytes: int}
     */
    public function forTenant(Tenant $tenant): array
    {
        return [
            'db_bytes' => $this->databaseUsageBytes($tenant),
            'media_bytes' => $this->mediaUsageBytes($tenant),
        ];
    }

    /**
     * Summed across every Library the given tenants collection represents —
     * used for the user-level totals shown in the User Management list/detail.
     *
     * @param  \Illuminate\Support\Collection<int, Tenant>  $tenants
     * @return array{db_bytes: int, media_bytes: int}
     */
    public function forTenants(iterable $tenants): array
    {
        $dbBytes = 0;
        $mediaBytes = 0;

        foreach ($tenants as $tenant) {
            $usage = $this->forTenant($tenant);
            $dbBytes += $usage['db_bytes'];
            $mediaBytes += $usage['media_bytes'];
        }

        return ['db_bytes' => $dbBytes, 'media_bytes' => $mediaBytes];
    }

    public static function bytesToMb(int $bytes): float
    {
        return round($bytes / 1024 / 1024, 2);
    }
}

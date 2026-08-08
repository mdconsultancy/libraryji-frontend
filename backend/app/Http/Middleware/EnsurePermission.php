<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * Module-level granular permission gate (view/add/edit/delete per module —
 * currently library/halls/members/payments). Admin and super_admin always
 * pass: permissions only ever restrict staff. The check reads the staff
 * member's own `tenant_user.permissions` row for their *current* Library —
 * never anything the client sends — so a staff account cannot bypass this
 * by hitting the API directly, only the UI it's meant to hide from would
 * be skipped that way, not the actual authorization.
 */
class EnsurePermission
{
    public function handle(Request $request, Closure $next, string $module, string $action): Response
    {
        $user = $request->user();

        if (! $user || in_array($user->role, ['admin', 'super_admin'], true)) {
            return $next($request);
        }

        $raw = DB::table('tenant_user')
            ->where('tenant_id', $user->current_tenant_id)
            ->where('user_id', $user->id)
            ->value('permissions');

        $permissions = $raw ? json_decode($raw, true) : [];

        if (empty($permissions[$module][$action])) {
            abort(403, "You do not have permission to {$action} {$module}.");
        }

        return $next($request);
    }
}

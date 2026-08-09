<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantIsActive
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->role === 'super_admin') {
            return $next($request);
        }

        if (! $user->current_tenant_id) {
            abort(403, 'Please select a library to continue.');
        }

        // Defense in depth: current_tenant_id is only ever set by login/
        // selectLibrary (both verify tenant_user membership first), but if
        // it were ever stale — e.g. an admin's access to a library was
        // revoked after they last switched into it — re-check here too.
        if (! $user->belongsToTenant($user->current_tenant_id)) {
            abort(403, 'You no longer have access to this library.');
        }

        $tenant = $user->currentTenant;

        if (! $tenant || in_array($tenant->status, ['suspended', 'cancelled'], true)) {
            abort(403, 'Your library account is suspended. Please contact support.');
        }

        // A tenant sits in `trial` status from registration until they pick
        // a plan (trial_ends_at null — never started one) and again once
        // their free month runs out (trial_ends_at in the past) — both are
        // "no access yet", not just the expiry case.
        if ($tenant->status === 'trial' && (! $tenant->trial_ends_at || $tenant->trial_ends_at->isPast())) {
            abort(403, $tenant->trial_ends_at
                ? 'Your trial period has expired. Please subscribe to continue.'
                : 'Please choose a plan to continue.');
        }

        return $next($request);
    }
}

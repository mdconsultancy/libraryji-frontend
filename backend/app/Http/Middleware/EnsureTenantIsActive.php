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

        $tenant = $user->tenant;

        if (! $tenant || in_array($tenant->status, ['suspended', 'cancelled'], true)) {
            abort(403, 'Your library account is suspended. Please contact support.');
        }

        if ($tenant->status === 'trial' && $tenant->trial_ends_at && $tenant->trial_ends_at->isPast()) {
            abort(403, 'Your trial period has expired. Please subscribe to continue.');
        }

        return $next($request);
    }
}

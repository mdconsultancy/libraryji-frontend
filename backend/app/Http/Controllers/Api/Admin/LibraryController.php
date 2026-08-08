<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\TenantSubscription;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Account-wide Library count/limit for an admin, and creating an
 * *additional* Library under an admin who already exists — distinct from
 * AuthController::register, which creates a brand-new admin + their first
 * Library together.
 */
class LibraryController extends Controller
{
    /**
     * "Best active plan wins": the admin's total allowed Library count is
     * the highest `max_libraries` among all their currently active
     * (active/trialing) per-Library subscriptions — not a sum, and not
     * just their first one. Upgrading any one Library's plan immediately
     * raises the shared, account-wide cap. No active subscription at all
     * means a limit of 0 (they can't add another until something is paid
     * for) — they still keep whatever Library/Libraries they already have.
     */
    public function summary(Request $request)
    {
        return response()->json($this->computeSummary($request->user()));
    }

    private function computeSummary($admin): array
    {
        $tenantIds = $admin->tenants()->wherePivot('role', 'admin')->pluck('tenants.id');
        $used = $tenantIds->count();

        $activeSubscriptions = TenantSubscription::whereIn('tenant_id', $tenantIds)
            ->whereIn('status', ['trialing', 'active'])
            ->with('plan')
            ->get();

        if ($activeSubscriptions->isEmpty()) {
            $limit = 0;
        } elseif ($activeSubscriptions->pluck('plan.max_libraries')->contains(null)) {
            $limit = null; // at least one active plan is unlimited
        } else {
            $limit = $activeSubscriptions->max(fn ($sub) => $sub->plan->max_libraries);
        }

        return [
            'used' => $used,
            'limit' => $limit,
            'remaining' => $limit === null ? null : max(0, $limit - $used),
            'exceeded' => $limit !== null && $used >= $limit,
        ];
    }

    /**
     * Create an *additional* Library for the already-authenticated admin —
     * reuses the account, does not create a new User (unlike register()).
     * Starts `suspended` (payment-pending) exactly like a fresh
     * registration; the caller is expected to switch into it and complete
     * payment via the existing PlanSelectionController flow immediately
     * after. Blocked once the account is at its Library limit.
     */
    public function store(Request $request)
    {
        $admin = $request->user();

        if ($admin->role !== 'admin') {
            abort(403, 'Only library owners can add libraries.');
        }

        $summary = $this->computeSummary($admin);
        if ($summary['exceeded']) {
            return response()->json([
                'message' => 'You have reached your Library limit for your current plan(s). Please upgrade to add another library.',
            ], 422);
        }

        $validated = $request->validate([
            'library_name' => 'required|string|max:255',
            'library_code' => 'nullable|string|max:50|unique:tenants,library_code',
            'established_year' => 'nullable|integer|min:1900|max:'.(now()->year + 1),
            // Each Library is a distinct billable entity with its own
            // contact details — tenants.email is globally unique, so this
            // can't just default to the admin's own account email (their
            // first Library's tenant row very likely already uses it).
            'email' => 'required|email|unique:tenants,email',
            'phone' => 'required|string|max:20',
            'address' => 'nullable|string|max:500',
            'state' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'pincode' => 'nullable|string|max:20',
            'gst_number' => 'nullable|string|max:30',
        ]);

        $slug = Str::slug($validated['library_name']).'-'.Str::lower(Str::random(5));

        $tenant = Tenant::create([
            'name' => $validated['library_name'],
            'slug' => $slug,
            'library_code' => $validated['library_code'] ?? Tenant::generateLibraryCode(),
            'established_year' => $validated['established_year'] ?? null,
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'address' => $validated['address'] ?? null,
            'state' => $validated['state'] ?? null,
            'city' => $validated['city'] ?? null,
            'pincode' => $validated['pincode'] ?? null,
            'gst_number' => $validated['gst_number'] ?? null,
            'status' => 'suspended',
            'trial_ends_at' => null,
        ]);

        $admin->tenants()->attach($tenant->id, ['role' => 'admin']);
        $admin->current_tenant_id = $tenant->id;
        $admin->save();

        return response()->json([
            'tenant' => $tenant,
            'user' => $admin->fresh()->load('currentTenant', 'tenants'),
        ], 201);
    }
}

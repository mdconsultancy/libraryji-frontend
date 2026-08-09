<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\TenantSubscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Account-wide Library count/limit for an admin, and creating an
 * *additional* Library under an admin who already exists — distinct from
 * AuthController::register, which creates a brand-new admin + their first
 * Library together.
 */
class LibraryController extends Controller
{
    public function summary(Request $request)
    {
        $admin = $request->user();
        $this->activateCoveredLibraries($admin);

        return response()->json($this->computeSummary($admin));
    }

    /**
     * "Best active plan wins": the admin's total allowed Library count is
     * the highest `max_libraries` among all their currently active
     * (active/trialing) per-Library subscriptions — not a sum, and not
     * just their first one. Upgrading any one Library's plan immediately
     * raises the shared, account-wide cap. No active subscription at all
     * means a limit of 0 (they can't add another until something is paid
     * for) — they still keep whatever Library/Libraries they already have.
     * `used` counts every Library the admin owns, including any still
     * payment-pending, so the cap can't be bypassed by leaving one suspended.
     */
    private function computeSummary($admin): array
    {
        $tenantIds = $admin->tenants()->wherePivot('role', 'admin')->pluck('tenants.id');
        $used = $tenantIds->count();
        $activeSubscriptions = $this->activeSubscriptionsFor($tenantIds);
        $limit = $this->limitFor($activeSubscriptions);

        return [
            'used' => $used,
            'limit' => $limit,
            'remaining' => $limit === null ? null : max(0, $limit - $used),
            'exceeded' => $limit !== null && $used >= $limit,
        ];
    }

    private function activeSubscriptionsFor($tenantIds)
    {
        return TenantSubscription::whereIn('tenant_id', $tenantIds)
            ->whereIn('status', ['trialing', 'active'])
            ->with('plan')
            ->get();
    }

    private function limitFor($activeSubscriptions): ?int
    {
        if ($activeSubscriptions->isEmpty()) {
            return 0;
        }

        if ($activeSubscriptions->pluck('plan.max_libraries')->contains(null)) {
            return null; // at least one active plan is unlimited
        }

        return $activeSubscriptions->max(fn ($sub) => $sub->plan->max_libraries);
    }

    /**
     * Self-heals Libraries left `suspended` (payment-pending) even though
     * the admin's *other* Libraries already carry an active subscription
     * with enough `max_libraries` headroom to cover them — e.g. Library #2
     * created while Library #1's Growth plan (max 2) is active. Those
     * Libraries are included in what was already paid for, so each one is
     * granted a $0 subscription cloned from the plan that covers it
     * (mirroring its renewal date) instead of forcing the admin through
     * checkout again. Oldest suspended Library first, capped at whatever
     * headroom the current plan(s) actually provide.
     *
     * Runs opportunistically (dashboard load, right after creating a new
     * Library) rather than via a queue/cron — it only ever touches this one
     * admin's own tenants, so it's cheap and safe to call on every request.
     */
    private function activateCoveredLibraries($admin): void
    {
        $tenants = $admin->tenants()->wherePivot('role', 'admin')->get(['tenants.id', 'tenants.status', 'tenants.created_at']);
        $activeSubscriptions = $this->activeSubscriptionsFor($tenants->pluck('id'));

        if ($activeSubscriptions->isEmpty()) {
            return;
        }

        $limit = $this->limitFor($activeSubscriptions);
        $occupied = $tenants->whereNotIn('status', ['suspended', 'cancelled'])->count();
        $remaining = $limit === null ? PHP_INT_MAX : max(0, $limit - $occupied);

        if ($remaining <= 0) {
            return;
        }

        $covering = $activeSubscriptions
            ->sortByDesc(fn ($sub) => $sub->plan->max_libraries === null ? PHP_INT_MAX : $sub->plan->max_libraries)
            ->first();

        $candidates = $tenants->where('status', 'suspended')->sortBy('created_at')->take($remaining);

        foreach ($candidates as $tenant) {
            DB::transaction(function () use ($tenant, $covering) {
                TenantSubscription::create([
                    'tenant_id' => $tenant->id,
                    'subscription_plan_id' => $covering->subscription_plan_id,
                    'status' => 'active',
                    'amount' => 0,
                    'currency' => $covering->currency ?? 'INR',
                    'starts_at' => now(),
                    'ends_at' => $covering->ends_at,
                    'payment_gateway' => 'included_in_plan',
                ]);

                Tenant::whereKey($tenant->id)->update(['status' => 'active']);
            });
        }
    }

    /**
     * Create an *additional* Library for the already-authenticated admin —
     * reuses the account, does not create a new User (unlike register()).
     * Created `suspended` first, then immediately re-checked against the
     * admin's existing active plan(s): if there's headroom under
     * `max_libraries`, activateCoveredLibraries() flips it straight to
     * `active` on a $0 piggyback subscription, with no second payment.
     * Only Libraries beyond the paid-for limit stay `suspended` and need to
     * go through PlanSelectionController's checkout flow. Blocked entirely
     * once the account is at its Library limit.
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

        $this->activateCoveredLibraries($admin);

        return response()->json([
            'tenant' => $tenant->fresh(),
            'user' => $admin->fresh()->load('currentTenant', 'tenants'),
        ], 201);
    }
}

<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\PlanLimitService;
use Illuminate\Http\Request;

/**
 * Read-only view of the tenant's own SaaS subscription/payment history.
 * Admin cannot create subscriptions manually here — that only happens via
 * PlanSelectionController after a verified Razorpay payment.
 */
class BillingController extends Controller
{
    public function __construct(private PlanLimitService $planLimits) {}

    public function index(Request $request)
    {
        $tenant = $request->user()->tenant;

        $subscriptions = $tenant->subscriptions()
            ->with('plan')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'tenant' => $tenant->load('activeSubscription.plan'),
            'subscriptions' => $subscriptions,
        ]);
    }

    /**
     * Limit + current usage for every plan-limited resource (seats,
     * members, staff) in one call, so list pages can disable their "Add"
     * button proactively instead of only finding out via a 422 after the
     * user has already filled out the create form.
     */
    public function limits(Request $request)
    {
        $tenant = $request->user()->tenant;

        return response()->json($this->planLimits->summary($tenant));
    }
}

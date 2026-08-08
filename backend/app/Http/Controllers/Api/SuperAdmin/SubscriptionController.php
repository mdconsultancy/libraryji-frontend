<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\TenantSubscription;
use Illuminate\Http\Request;

/**
 * Platform-wide, read-only view of every tenant's SaaS subscriptions.
 * Each row also doubles as the payment record for that billing cycle
 * (invoice_number, gateway_reference, amount) — there's no separate
 * platform-level Payment model, so this view covers both "Subscriptions"
 * and "Payments" from the Super Admin's perspective.
 */
class SubscriptionController extends Controller
{
    public function index(Request $request)
    {
        $subscriptions = TenantSubscription::with(['tenant:id,name,email', 'plan:id,name,billing_cycle'])
            ->when($request->tenant_id, fn ($q) => $q->where('tenant_id', $request->tenant_id))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->from && $request->to, fn ($q) => $q->whereBetween('created_at', [$request->from, $request->to]))
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15));

        return response()->json($subscriptions);
    }
}

<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPlan;
use App\Models\TenantSubscription;
use App\Services\RazorpayService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Activates a tenant's SaaS subscription via Razorpay. Used both right after
 * registration (tenant starts out payment-pending) and to reactivate a
 * suspended/trial-expired tenant. Two-step flow: create an Order, take the
 * admin through Razorpay Checkout client-side, then verify the signature
 * before actually granting access.
 */
class PlanSelectionController extends Controller
{
    public function __construct(private RazorpayService $razorpay) {}

    public function createOrder(Request $request)
    {
        $validated = $request->validate([
            'subscription_plan_id' => 'required|exists:subscription_plans,id',
        ]);

        if (! $this->razorpay->isConfigured()) {
            return response()->json([
                'message' => 'Online payments are not configured yet. Please contact support.',
            ], 422);
        }

        $plan = SubscriptionPlan::findOrFail($validated['subscription_plan_id']);
        $tenant = $request->user()->currentTenant;

        $receipt = 'tenant-'.$tenant->id.'-'.now()->format('YmdHis');

        $order = $this->razorpay->createOrder((float) $plan->price, $receipt, [
            'tenant_id' => (string) $tenant->id,
            'subscription_plan_id' => (string) $plan->id,
        ]);

        if (! $order) {
            return response()->json(['message' => 'Unable to create payment order. Please try again.'], 422);
        }

        return response()->json([
            'order_id' => $order['id'],
            'amount' => $order['amount'],
            'currency' => $order['currency'],
            'key_id' => $this->razorpay->keyId(),
            'plan' => $plan,
        ]);
    }

    public function verify(Request $request)
    {
        $validated = $request->validate([
            'subscription_plan_id' => 'required|exists:subscription_plans,id',
            'razorpay_order_id' => 'required|string',
            'razorpay_payment_id' => 'required|string',
            'razorpay_signature' => 'required|string',
        ]);

        if (! $this->razorpay->verifySignature(
            $validated['razorpay_order_id'],
            $validated['razorpay_payment_id'],
            $validated['razorpay_signature'],
        )) {
            return response()->json(['message' => 'Payment verification failed.'], 422);
        }

        $tenant = $request->user()->currentTenant;

        // Idempotency: if this order was already verified (double submit,
        // Razorpay handler firing twice, user refreshing mid-request), don't
        // create a second subscription/charge record for the same payment.
        $existing = TenantSubscription::where('tenant_id', $tenant->id)
            ->where('razorpay_order_id', $validated['razorpay_order_id'])
            ->first();

        if ($existing) {
            return response()->json([
                'subscription' => $existing->load('plan'),
                'tenant' => $tenant->fresh(),
            ], 200);
        }

        $plan = SubscriptionPlan::findOrFail($validated['subscription_plan_id']);

        try {
            $subscription = DB::transaction(function () use ($plan, $tenant, $validated) {
                $endsAt = match ($plan->billing_cycle) {
                    'yearly' => now()->addYear(),
                    'quarterly' => now()->addMonths(3),
                    default => now()->addMonth(),
                };

                $subscription = TenantSubscription::create([
                    'tenant_id' => $tenant->id,
                    'subscription_plan_id' => $plan->id,
                    'status' => 'active',
                    'amount' => $plan->price,
                    'currency' => 'INR',
                    'starts_at' => now(),
                    'ends_at' => $endsAt,
                    'payment_gateway' => 'razorpay',
                    'gateway_reference' => $validated['razorpay_payment_id'],
                    'razorpay_order_id' => $validated['razorpay_order_id'],
                    'razorpay_signature' => $validated['razorpay_signature'],
                    'invoice_number' => 'INV-'.$tenant->id.'-'.now()->format('YmdHis').Str::upper(Str::random(4)),
                ]);

                $tenant->update(['status' => 'active']);

                return $subscription;
            });
        } catch (QueryException $e) {
            // Unique constraint on razorpay_order_id tripped: a concurrent
            // request already recorded this exact payment. Return that
            // record instead of surfacing a 500 — the payment did succeed.
            if (str_contains($e->getMessage(), 'razorpay_order_id')) {
                $existing = TenantSubscription::where('tenant_id', $tenant->id)
                    ->where('razorpay_order_id', $validated['razorpay_order_id'])
                    ->first();

                if ($existing) {
                    return response()->json([
                        'subscription' => $existing->load('plan'),
                        'tenant' => $tenant->fresh(),
                    ], 200);
                }
            }

            throw $e;
        }

        return response()->json([
            'subscription' => $subscription->load('plan'),
            'tenant' => $tenant->fresh(),
        ], 201);
    }
}

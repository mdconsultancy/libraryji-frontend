<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\MemberSubscription;
use App\Models\MembershipPlan;
use App\Models\Payment;
use App\Models\Seat;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class MemberSubscriptionController extends Controller
{
    public function index(Request $request)
    {
        $subscriptions = MemberSubscription::with(['member', 'plan', 'seat', 'shift'])
            ->when($request->member_id, fn ($q) => $q->where('member_id', $request->member_id))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->expiring_in_days, function ($q) use ($request) {
                $q->where('status', 'active')
                    ->whereDate('end_date', '<=', now()->addDays((int) $request->expiring_in_days))
                    ->whereDate('end_date', '>=', now());
            })
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15));

        return response()->json($subscriptions);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'member_id' => 'required|exists:members,id',
            // Either an admin-configured plan, a raw month duration, or an
            // explicit custom end_date (the wizard's "Custom Date" option) —
            // one of the three is required.
            'membership_plan_id' => 'nullable|exists:membership_plans,id',
            'duration_months' => 'required_without_all:membership_plan_id,end_date|nullable|integer|min:1|max:60',
            'seat_id' => 'nullable|exists:seats,id',
            'shift_id' => 'nullable|exists:shifts,id',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date',
            'amount' => 'nullable|numeric|min:0',
            'payment_type' => 'nullable|in:cash,card,upi,bank_transfer,razorpay,stripe,other',
        ]);

        $plan = ! empty($validated['membership_plan_id'])
            ? MembershipPlan::findOrFail($validated['membership_plan_id'])
            : null;

        if (! empty($validated['seat_id'])) {
            $seat = Seat::findOrFail($validated['seat_id']);
            if ($seat->status === 'occupied') {
                return response()->json(['message' => 'Selected seat is already occupied.'], 422);
            }
        }

        $subscription = DB::transaction(function () use ($validated, $plan) {
            $durationMonths = $plan ? null : ($validated['duration_months'] ?? null);
            $startDate = Carbon::parse($validated['start_date']);
            $endDate = ! empty($validated['end_date'])
                ? Carbon::parse($validated['end_date'])
                : ($plan
                    ? $startDate->copy()->addDays($plan->duration_days)
                    : $startDate->copy()->addMonthsNoOverflow($durationMonths));

            $planLabel = match (true) {
                (bool) $plan => $plan->name,
                (bool) $durationMonths => $durationMonths.' Month'.($durationMonths > 1 ? 's' : ''),
                default => 'Custom ('.$startDate->diffInDays($endDate).' days)',
            };

            $subscription = MemberSubscription::create([
                'member_id' => $validated['member_id'],
                'membership_plan_id' => $plan?->id,
                'duration_months' => $durationMonths,
                'seat_id' => $validated['seat_id'] ?? null,
                'shift_id' => $validated['shift_id'] ?? $plan?->shift_id,
                'plan_name_snapshot' => $planLabel,
                'amount' => $validated['amount'] ?? $plan?->price ?? 0,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'status' => 'active',
            ]);

            if ($subscription->seat_id) {
                Seat::whereKey($subscription->seat_id)->update(['status' => 'occupied']);
            }

            $subscription->member()->update(['status' => 'active']);

            if (($validated['amount'] ?? 0) > 0 && ! empty($validated['payment_type'])) {
                Payment::create([
                    'member_id' => $subscription->member_id,
                    'member_subscription_id' => $subscription->id,
                    'invoice_number' => $this->generateInvoiceNumber(),
                    'type' => 'subscription',
                    'amount' => $validated['amount'],
                    'payment_method' => $validated['payment_type'],
                    'status' => 'paid',
                    'paid_at' => $subscription->start_date,
                ]);
            }

            return $subscription;
        });

        return response()->json($subscription->load(['member', 'plan', 'seat', 'shift']), 201);
    }

    private function generateInvoiceNumber(): string
    {
        $tenantId = Auth::user()->current_tenant_id;

        return sprintf('INV-%d-%s', $tenantId, now()->format('YmdHis').random_int(100, 999));
    }

    public function show(MemberSubscription $memberSubscription)
    {
        return response()->json($memberSubscription->load(['member', 'plan', 'seat', 'shift', 'payments']));
    }

    public function update(Request $request, MemberSubscription $memberSubscription)
    {
        $validated = $request->validate([
            'seat_id' => 'nullable|exists:seats,id',
            'shift_id' => 'nullable|exists:shifts,id',
            'start_date' => 'sometimes|required|date',
            'end_date' => 'sometimes|required|date',
            'duration_months' => 'nullable|integer|min:1|max:60',
            'amount' => 'nullable|numeric|min:0',
            'status' => 'in:active,expired,cancelled',
        ]);

        $seatChanged = array_key_exists('seat_id', $validated) && $validated['seat_id'] !== $memberSubscription->seat_id;

        if ($seatChanged && ! empty($validated['seat_id'])) {
            $seat = Seat::findOrFail($validated['seat_id']);
            if ($seat->status === 'occupied') {
                return response()->json(['message' => 'Selected seat is already occupied.'], 422);
            }
        }

        DB::transaction(function () use ($memberSubscription, $validated, $seatChanged) {
            if ($seatChanged) {
                if ($memberSubscription->seat_id) {
                    Seat::whereKey($memberSubscription->seat_id)->update(['status' => 'available']);
                }
                if (! empty($validated['seat_id'])) {
                    Seat::whereKey($validated['seat_id'])->update(['status' => 'occupied']);
                }
            }

            $memberSubscription->update($validated);

            if (($validated['status'] ?? null) === 'cancelled' && $memberSubscription->seat_id) {
                Seat::whereKey($memberSubscription->seat_id)->update(['status' => 'available']);
            }
        });

        return response()->json($memberSubscription->fresh(['member', 'plan', 'seat', 'shift']));
    }

    public function destroy(MemberSubscription $memberSubscription)
    {
        DB::transaction(function () use ($memberSubscription) {
            if ($memberSubscription->seat_id) {
                Seat::whereKey($memberSubscription->seat_id)->update(['status' => 'available']);
            }
            $memberSubscription->update(['status' => 'cancelled']);
        });

        return response()->json(['message' => 'Subscription cancelled successfully.']);
    }

    public function renew(Request $request, MemberSubscription $memberSubscription)
    {
        $validated = $request->validate([
            'membership_plan_id' => 'nullable|exists:membership_plans,id',
            'seat_id' => 'nullable|exists:seats,id',
            'amount' => 'nullable|numeric|min:0',
        ]);

        $plan = MembershipPlan::findOrFail($validated['membership_plan_id'] ?? $memberSubscription->membership_plan_id);

        $newSubscription = DB::transaction(function () use ($memberSubscription, $validated, $plan) {
            $startDate = $memberSubscription->end_date->isFuture()
                ? $memberSubscription->end_date->copy()->addDay()
                : now();
            $endDate = $startDate->copy()->addDays($plan->duration_days);

            $seatId = array_key_exists('seat_id', $validated) ? $validated['seat_id'] : $memberSubscription->seat_id;

            $new = MemberSubscription::create([
                'member_id' => $memberSubscription->member_id,
                'membership_plan_id' => $plan->id,
                'seat_id' => $seatId,
                'shift_id' => $memberSubscription->shift_id,
                'plan_name_snapshot' => $plan->name,
                'amount' => $validated['amount'] ?? $plan->price,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'status' => 'active',
            ]);

            if ($seatId) {
                Seat::whereKey($seatId)->update(['status' => 'occupied']);
            }

            $new->member()->update(['status' => 'active']);

            return $new;
        });

        return response()->json($newSubscription->load(['member', 'plan', 'seat', 'shift']), 201);
    }
}

<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\MembershipPlan;
use Illuminate\Http\Request;

class MembershipPlanController extends Controller
{
    public function index(Request $request)
    {
        $plans = MembershipPlan::with('shift')
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->orderBy('price')
            ->get();

        return response()->json($plans);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'shift_id' => 'nullable|exists:shifts,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'duration_days' => 'required|integer|min:1',
            'price' => 'required|numeric|min:0',
            'seat_type' => 'nullable|in:general,ac,non_ac,cabin,premium',
            'fixed_seat' => 'boolean',
            'status' => 'in:active,inactive',
        ]);

        $plan = MembershipPlan::create($validated);

        return response()->json($plan, 201);
    }

    public function show(MembershipPlan $membershipPlan)
    {
        return response()->json($membershipPlan->load('shift'));
    }

    public function update(Request $request, MembershipPlan $membershipPlan)
    {
        $validated = $request->validate([
            'shift_id' => 'nullable|exists:shifts,id',
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'duration_days' => 'sometimes|required|integer|min:1',
            'price' => 'sometimes|required|numeric|min:0',
            'seat_type' => 'nullable|in:general,ac,non_ac,cabin,premium',
            'fixed_seat' => 'boolean',
            'status' => 'in:active,inactive',
        ]);

        $membershipPlan->update($validated);

        return response()->json($membershipPlan);
    }

    public function destroy(MembershipPlan $membershipPlan)
    {
        $membershipPlan->delete();

        return response()->json(['message' => 'Membership plan deleted successfully.']);
    }
}

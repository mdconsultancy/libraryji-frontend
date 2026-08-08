<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SubscriptionPlanController extends Controller
{
    public function index()
    {
        return response()->json(SubscriptionPlan::orderBy('sort_order')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'billing_cycle' => 'required|in:monthly,quarterly,yearly',
            'max_seats' => 'required|integer|min:1',
            'max_members' => 'required|integer|min:1',
            'max_staff' => 'required|integer|min:1',
            // How many total Libraries this plan entitles the admin's
            // account to operate. Null/omitted = unlimited.
            'max_libraries' => 'nullable|integer|min:1',
            'features' => 'nullable|array',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $validated['slug'] = Str::slug($validated['name']).'-'.Str::lower(Str::random(4));

        $plan = SubscriptionPlan::create($validated);

        return response()->json($plan, 201);
    }

    public function show(SubscriptionPlan $subscriptionPlan)
    {
        return response()->json($subscriptionPlan);
    }

    public function update(Request $request, SubscriptionPlan $subscriptionPlan)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|required|numeric|min:0',
            'billing_cycle' => 'in:monthly,quarterly,yearly',
            'max_seats' => 'integer|min:1',
            'max_members' => 'integer|min:1',
            'max_staff' => 'integer|min:1',
            'max_libraries' => 'nullable|integer|min:1',
            'features' => 'nullable|array',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $subscriptionPlan->update($validated);

        return response()->json($subscriptionPlan);
    }

    public function destroy(SubscriptionPlan $subscriptionPlan)
    {
        $subscriptionPlan->delete();

        return response()->json(['message' => 'Subscription plan deleted successfully.']);
    }
}

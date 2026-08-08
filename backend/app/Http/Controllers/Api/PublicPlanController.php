<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPlan;

class PublicPlanController extends Controller
{
    /**
     * Active plans available for a tenant to subscribe to. Public — used by
     * both the registration wizard and the post-registration plan gate.
     */
    public function index()
    {
        $plans = SubscriptionPlan::where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return response()->json($plans);
    }
}

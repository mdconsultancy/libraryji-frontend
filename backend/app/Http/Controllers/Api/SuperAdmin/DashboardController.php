<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\Tenant;
use App\Models\TenantSubscription;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function summary(Request $request)
    {
        $totalTenants = Tenant::count();
        $activeTenants = Tenant::where('status', 'active')->count();
        $trialTenants = Tenant::where('status', 'trial')->count();
        $suspendedTenants = Tenant::where('status', 'suspended')->count();

        $totalMembers = Member::withoutGlobalScopes()->count();

        $mrr = TenantSubscription::where('status', 'active')->sum('amount');

        return response()->json([
            'total_tenants' => $totalTenants,
            'active_tenants' => $activeTenants,
            'trial_tenants' => $trialTenants,
            'suspended_tenants' => $suspendedTenants,
            'total_members_platform_wide' => $totalMembers,
            'monthly_recurring_revenue' => (float) $mrr,
        ]);
    }

    public function tenantGrowthChart(Request $request)
    {
        $months = collect(range(5, 0))->map(function ($i) {
            $date = now()->subMonths($i);

            $count = Tenant::whereMonth('created_at', $date->month)
                ->whereYear('created_at', $date->year)
                ->count();

            return [
                'month' => $date->format('M Y'),
                'new_tenants' => $count,
            ];
        });

        return response()->json($months);
    }

    public function revenueChart(Request $request)
    {
        $months = collect(range(5, 0))->map(function ($i) {
            $date = now()->subMonths($i);

            $revenue = TenantSubscription::whereIn('status', ['active', 'trialing'])
                ->whereMonth('created_at', $date->month)
                ->whereYear('created_at', $date->year)
                ->sum('amount');

            return [
                'month' => $date->format('M Y'),
                'revenue' => (float) $revenue,
            ];
        });

        return response()->json($months);
    }
}

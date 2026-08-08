<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Member;
use App\Models\MemberSubscription;
use App\Models\Payment;
use App\Models\Seat;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function summary(Request $request)
    {
        $totalMembers = Member::count();
        $activeMembers = Member::where('status', 'active')->count();
        $totalSeats = Seat::count();
        $occupiedSeats = Seat::where('status', 'occupied')->count();

        $expiringSoon = MemberSubscription::where('status', 'active')
            ->whereDate('end_date', '<=', now()->addDays(7))
            ->whereDate('end_date', '>=', now())
            ->count();

        $todayAttendance = Attendance::whereDate('date', now()->toDateString())->count();
        $currentlyCheckedIn = Attendance::whereDate('date', now()->toDateString())->whereNull('check_out')->count();

        $revenueThisMonth = Payment::where('status', 'paid')
            ->whereMonth('paid_at', now()->month)
            ->whereYear('paid_at', now()->year)
            ->sum('amount');

        $revenueLastMonth = Payment::where('status', 'paid')
            ->whereMonth('paid_at', now()->subMonth()->month)
            ->whereYear('paid_at', now()->subMonth()->year)
            ->sum('amount');

        $cashThisMonth = Payment::where('status', 'paid')
            ->where('payment_method', 'cash')
            ->whereMonth('paid_at', now()->month)
            ->whereYear('paid_at', now()->year)
            ->sum('amount');

        $onlineThisMonth = $revenueThisMonth - $cashThisMonth;

        return response()->json([
            'total_members' => $totalMembers,
            'active_members' => $activeMembers,
            'present_today' => $currentlyCheckedIn,
            'absent_today' => max($activeMembers - $todayAttendance, 0),
            'total_seats' => $totalSeats,
            'occupied_seats' => $occupiedSeats,
            'available_seats' => $totalSeats - $occupiedSeats,
            'occupancy_rate' => $totalSeats > 0 ? round(($occupiedSeats / $totalSeats) * 100, 1) : 0,
            'expiring_soon' => $expiringSoon,
            'today_attendance' => $todayAttendance,
            'currently_checked_in' => $currentlyCheckedIn,
            'revenue_this_month' => (float) $revenueThisMonth,
            'revenue_last_month' => (float) $revenueLastMonth,
            'cash_this_month' => (float) $cashThisMonth,
            'online_this_month' => (float) $onlineThisMonth,
        ]);
    }

    public function revenueChart(Request $request)
    {
        $months = collect(range(5, 0))->map(function ($i) {
            $date = now()->subMonths($i);

            $revenue = Payment::where('status', 'paid')
                ->whereMonth('paid_at', $date->month)
                ->whereYear('paid_at', $date->year)
                ->sum('amount');

            return [
                'month' => $date->format('M Y'),
                'revenue' => (float) $revenue,
            ];
        });

        return response()->json($months);
    }

    public function attendanceChart(Request $request)
    {
        $activeMembers = Member::where('status', 'active')->count();

        $days = collect(range(6, 0))->map(function ($i) use ($activeMembers) {
            $date = now()->subDays($i);

            $present = Attendance::whereDate('date', $date->toDateString())
                ->distinct('member_id')
                ->count('member_id');

            return [
                'date' => $date->format('D'),
                'count' => $present,
                'present' => $present,
                'absent' => max($activeMembers - $present, 0),
            ];
        });

        return response()->json($days);
    }

    public function expiringMemberships(Request $request)
    {
        $subscriptions = MemberSubscription::with(['member', 'plan'])
            ->where('status', 'active')
            ->whereDate('end_date', '<=', now()->addDays($request->integer('days', 7)))
            ->whereDate('end_date', '>=', now())
            ->orderBy('end_date')
            ->get();

        return response()->json($subscriptions);
    }

    public function recentMembers(Request $request)
    {
        $members = Member::with('activeSubscription.seat')
            ->orderByDesc('created_at')
            ->limit($request->integer('limit', 5))
            ->get();

        return response()->json($members);
    }
}

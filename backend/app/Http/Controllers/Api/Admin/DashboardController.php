<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Expense;
use App\Models\Member;
use App\Models\MemberSubscription;
use App\Models\Payment;
use App\Models\Seat;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function summary(Request $request)
    {
        $tenant = $request->user()->currentTenant;

        $totalMembers = Member::count();
        $activeMembers = Member::where('status', 'active')->count();
        $totalSeats = Seat::count();
        $occupiedSeats = Seat::where('status', 'occupied')->count();
        $staffCount = $tenant->staff()->count();
        $hallsCount = $tenant->halls()->count();

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

        $expensesThisMonth = Expense::whereMonth('expense_date', now()->month)
            ->whereYear('expense_date', now()->year)
            ->sum('amount');

        return response()->json([
            'total_members' => $totalMembers,
            'active_members' => $activeMembers,
            'present_today' => $currentlyCheckedIn,
            'absent_today' => max($activeMembers - $todayAttendance, 0),
            'total_seats' => $totalSeats,
            'occupied_seats' => $occupiedSeats,
            'available_seats' => $totalSeats - $occupiedSeats,
            'occupancy_rate' => $totalSeats > 0 ? round(($occupiedSeats / $totalSeats) * 100, 1) : 0,
            'staff_count' => $staffCount,
            'halls_count' => $hallsCount,
            'expenses_this_month' => (float) $expensesThisMonth,
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
        $span = min(max($request->integer('months', 6), 1), 24);

        $months = collect(range($span - 1, 0))->map(function ($i) {
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
        $span = min(max($request->integer('days', 7), 1), 90);
        $activeMembers = Member::where('status', 'active')->count();

        $days = collect(range($span - 1, 0))->map(function ($i) use ($activeMembers) {
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

    /**
     * Unified feed for the dashboard's "Recent Activities" card — merges
     * three different tables into one timeline instead of the UI having to
     * stitch together separate member/payment/attendance calls itself.
     */
    public function recentActivity(Request $request)
    {
        $limit = min(max($request->integer('limit', 10), 1), 50);

        $newMembers = Member::orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(fn (Member $member) => [
                'type' => 'member_joined',
                'title' => "{$member->name} joined",
                'subtitle' => $member->member_code,
                'occurred_at' => $member->created_at,
            ]);

        $payments = Payment::with('member')
            ->where('status', 'paid')
            ->orderByDesc('paid_at')
            ->limit($limit)
            ->get()
            ->map(fn (Payment $payment) => [
                'type' => 'payment_received',
                'title' => ($payment->member?->name ?? 'A member').' made a payment',
                'subtitle' => '₹'.number_format((float) $payment->amount, 2),
                'occurred_at' => $payment->paid_at,
            ]);

        $checkIns = Attendance::with('member')
            ->orderByDesc('check_in')
            ->limit($limit)
            ->get()
            ->map(fn (Attendance $attendance) => [
                'type' => 'attendance_check_in',
                'title' => ($attendance->member?->name ?? 'A member').' checked in',
                'subtitle' => $attendance->check_out ? 'Checked out' : 'Currently present',
                'occurred_at' => $attendance->check_in,
            ]);

        $activity = $newMembers
            ->concat($payments)
            ->concat($checkIns)
            ->filter(fn ($item) => $item['occurred_at'] !== null)
            ->sortByDesc('occurred_at')
            ->take($limit)
            ->values();

        return response()->json($activity);
    }
}

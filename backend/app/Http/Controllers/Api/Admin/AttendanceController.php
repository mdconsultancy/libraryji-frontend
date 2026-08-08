<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Member;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $attendances = Attendance::with('member')
            ->when($request->member_id, fn ($q) => $q->where('member_id', $request->member_id))
            ->when($request->date, fn ($q) => $q->whereDate('date', $request->date))
            ->when($request->from && $request->to, fn ($q) => $q->whereBetween('date', [$request->from, $request->to]))
            ->orderByDesc('check_in')
            ->paginate($request->integer('per_page', 20));

        return response()->json($attendances);
    }

    public function checkIn(Request $request)
    {
        $validated = $request->validate([
            'member_id' => 'required|exists:members,id',
            'method' => 'in:manual,qr,self',
        ]);

        $member = Member::findOrFail($validated['member_id']);

        $open = Attendance::where('member_id', $member->id)->whereNull('check_out')->first();
        if ($open) {
            return response()->json(['message' => 'Member is already checked in.', 'attendance' => $open], 422);
        }

        $attendance = Attendance::create([
            'member_id' => $member->id,
            'date' => now()->toDateString(),
            'check_in' => now(),
            'method' => $validated['method'] ?? 'manual',
        ]);

        return response()->json($attendance->load('member'), 201);
    }

    public function checkOut(Request $request, Attendance $attendance)
    {
        if ($attendance->check_out) {
            return response()->json(['message' => 'Member is already checked out.'], 422);
        }

        $attendance->update(['check_out' => now()]);

        return response()->json($attendance->load('member'));
    }

    public function show(Request $request, Attendance $attendance)
    {
        return response()->json($attendance->load('member'));
    }

    public function destroy(Request $request, Attendance $attendance)
    {
        $attendance->delete();

        return response()->json(['message' => 'Attendance record deleted.']);
    }
}

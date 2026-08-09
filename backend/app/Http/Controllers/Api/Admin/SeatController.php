<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Seat;
use App\Services\PlanLimitService;
use Illuminate\Http\Request;

class SeatController extends Controller
{
    public function __construct(
        private PlanLimitService $planLimits,
    ) {}

    public function index(Request $request)
    {
        $seats = Seat::with(['hall', 'currentSubscription.member'])
            ->when($request->hall_id, fn ($q) => $q->where('hall_id', $request->hall_id))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->seat_type, fn ($q) => $q->where('seat_type', $request->seat_type))
            ->when($request->category, fn ($q) => $q->where('category', $request->category))
            ->orderBy('seat_number')
            ->get();

        return response()->json($seats);
    }

    public function store(Request $request)
    {
        $tenant = $request->user()->currentTenant;

        if ($limit = $this->planLimits->limit($tenant, 'seats')) {
            if ($this->planLimits->wouldExceed($tenant, 'seats')) {
                return response()->json(['message' => $this->planLimits->limitMessage('seats', $limit)], 422);
            }
        }

        $validated = $request->validate([
            'hall_id' => 'nullable|exists:halls,id',
            'seat_number' => 'required|string|max:50',
            'seat_type' => 'in:general,ac,non_ac,cabin,premium',
            'category' => 'in:regular,rotation',
            'status' => 'in:available,occupied,reserved,maintenance',
        ]);

        $seat = Seat::create($validated);

        return response()->json($seat, 201);
    }

    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'hall_id' => 'nullable|exists:halls,id',
            'prefix' => 'nullable|string|max:20',
            'start' => 'required|integer|min:1',
            'end' => 'required|integer|min:1|gte:start',
            'seat_type' => 'in:general,ac,non_ac,cabin,premium',
            'category' => 'in:regular,rotation',
        ]);

        $tenant = $request->user()->currentTenant;
        $requested = $validated['end'] - $validated['start'] + 1;

        if ($limit = $this->planLimits->limit($tenant, 'seats')) {
            if ($this->planLimits->wouldExceed($tenant, 'seats', $requested)) {
                return response()->json(['message' => $this->planLimits->limitMessage('seats', $limit)], 422);
            }
        }

        $created = [];
        for ($i = $validated['start']; $i <= $validated['end']; $i++) {
            $created[] = Seat::firstOrCreate(
                [
                    'seat_number' => ($validated['prefix'] ?? '').$i,
                ],
                [
                    'hall_id' => $validated['hall_id'] ?? null,
                    'seat_type' => $validated['seat_type'] ?? 'general',
                    'category' => $validated['category'] ?? 'regular',
                    'status' => 'available',
                ]
            );
        }

        return response()->json($created, 201);
    }

    public function show(Request $request, Seat $seat)
    {
        $seat->load(['hall', 'currentSubscription.member']);

        return response()->json($seat);
    }

    public function update(Request $request, Seat $seat)
    {
        $validated = $request->validate([
            'hall_id' => 'nullable|exists:halls,id',
            'seat_number' => 'sometimes|required|string|max:50',
            'seat_type' => 'in:general,ac,non_ac,cabin,premium',
            'category' => 'in:regular,rotation',
            'status' => 'in:available,occupied,reserved,maintenance',
            'position_x' => 'nullable|numeric',
            'position_y' => 'nullable|numeric',
        ]);

        $seat->update($validated);

        return response()->json($seat);
    }

    public function destroy(Request $request, Seat $seat)
    {
        $seat->delete();

        return response()->json(['message' => 'Seat deleted successfully.']);
    }
}

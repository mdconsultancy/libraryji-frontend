<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Hall;
use Illuminate\Http\Request;

class HallController extends Controller
{
    public function index(Request $request)
    {
        $halls = Hall::withCount('seats')
            ->orderBy('name')
            ->get();

        return response()->json($halls);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'in:active,inactive',
            // Optional: defaults to the caller's current workspace. When given
            // explicitly (multi-library admin picking a different Library from
            // the form), it must be one they actually belong to — never trust
            // this beyond that membership check.
            'tenant_id' => 'nullable|integer',
        ]);

        $tenantId = $validated['tenant_id'] ?? $request->user()->current_tenant_id;

        if (! $request->user()->belongsToTenant((int) $tenantId)) {
            abort(403, 'You do not have access to that library.');
        }

        unset($validated['tenant_id']);
        $validated['tenant_id'] = $tenantId;

        $hall = Hall::create($validated);

        return response()->json($hall, 201);
    }

    public function show(Hall $hall)
    {
        $hall->loadCount('seats');

        return response()->json($hall);
    }

    public function update(Request $request, Hall $hall)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'in:active,inactive',
        ]);

        $hall->update($validated);

        return response()->json($hall);
    }

    public function destroy(Hall $hall)
    {
        $hall->delete();

        return response()->json(['message' => 'Hall deleted successfully.']);
    }
}

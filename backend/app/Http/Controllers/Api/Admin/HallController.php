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
        ]);

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

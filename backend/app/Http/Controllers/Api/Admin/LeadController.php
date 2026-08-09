<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    public function index(Request $request)
    {
        $leads = Lead::when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->search, function ($q) use ($request) {
                $q->where(function ($q2) use ($request) {
                    $q2->where('name', 'like', "%{$request->search}%")
                        ->orWhere('phone', 'like', "%{$request->search}%");
                });
            })
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15));

        return response()->json($leads);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'whatsapp_number' => 'nullable|string|max:20',
            'notes' => 'nullable|string',
        ]);

        $validated['whatsapp_number'] = $validated['whatsapp_number'] ?? $validated['phone'];
        $validated['status'] = 'new';

        $lead = Lead::create($validated);

        return response()->json($lead, 201);
    }

    public function show(Request $request, Lead $lead)
    {
        return response()->json($lead->load('convertedMember'));
    }

    public function update(Request $request, Lead $lead)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'sometimes|required|string|max:20',
            'whatsapp_number' => 'nullable|string|max:20',
            'status' => 'in:new,contacted,converted,lost',
            'notes' => 'nullable|string',
            'converted_member_id' => 'nullable|exists:members,id',
        ]);

        $lead->update($validated);

        return response()->json($lead);
    }

    public function destroy(Request $request, Lead $lead)
    {
        $lead->delete();

        return response()->json(['message' => 'Lead deleted successfully.']);
    }
}

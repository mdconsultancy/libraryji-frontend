<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class TenantSettingsController extends Controller
{
    public function show(Request $request)
    {
        return response()->json($request->user()->currentTenant);
    }

    public function update(Request $request)
    {
        $tenant = $request->user()->currentTenant;

        // address/city/state/pincode/gst_number/established_year/alternate_phone
        // are deliberately not exposed on the regular Library settings page
        // (shown read-only there — "contact support to change") but are
        // editable here for the post-registration onboarding flow, which
        // only ever sends the subset a given step actually collects.
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'timezone' => 'nullable|string|max:100',
            'alternate_phone' => 'nullable|string|max:20',
            'established_year' => 'nullable|integer|min:1900|max:'.(now()->year + 1),
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'pincode' => 'nullable|string|max:20',
            'gst_number' => 'nullable|string|max:30',
        ]);

        $tenant->update($validated);

        return response()->json($tenant);
    }

    /** Marks the post-registration onboarding wizard as done for this tenant — never shown again. */
    public function completeOnboarding(Request $request)
    {
        $tenant = $request->user()->currentTenant;
        $tenant->update(['onboarding_completed_at' => now()]);

        return response()->json($tenant);
    }
}

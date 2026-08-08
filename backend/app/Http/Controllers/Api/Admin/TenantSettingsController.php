<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class TenantSettingsController extends Controller
{
    public function show(Request $request)
    {
        return response()->json($request->user()->tenant);
    }

    public function update(Request $request)
    {
        $tenant = $request->user()->tenant;

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'timezone' => 'nullable|string|max:100',
        ]);

        $tenant->update($validated);

        return response()->json($tenant);
    }
}

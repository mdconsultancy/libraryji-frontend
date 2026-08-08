<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\PlanLimitService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

/**
 * Staff/admin users of the currently selected Library. `User` no longer has
 * a global tenant scope (a user can belong to more than one Library via the
 * `tenant_user` pivot), so every method here scopes explicitly through the
 * pivot to the caller's `current_tenant_id` — never trusting anything the
 * client sends for that.
 */
class StaffController extends Controller
{
    public function __construct(private PlanLimitService $planLimits) {}

    private function scopedQuery(Request $request)
    {
        $tenantId = $request->user()->current_tenant_id;

        return User::whereIn('role', ['admin', 'staff'])
            ->whereHas('tenants', fn ($q) => $q->where('tenants.id', $tenantId));
    }

    public function index(Request $request)
    {
        $staff = $this->scopedQuery($request)
            ->when($request->role, fn ($q) => $q->where('role', $request->role))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->orderBy('name')
            ->paginate($request->integer('per_page', 15));

        return response()->json($staff);
    }

    public function store(Request $request)
    {
        $tenant = $request->user()->currentTenant;

        if ($limit = $this->planLimits->limit($tenant, 'staff')) {
            if ($this->planLimits->wouldExceed($tenant, 'staff')) {
                return response()->json(['message' => $this->planLimits->limitMessage('staff', $limit)], 422);
            }
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            // Plain `unique:users,email` queries the raw table and ignores the
            // SoftDeletes global scope, so a soft-deleted user's email would
            // falsely block re-registration — exclude trashed rows explicitly.
            'email' => ['required', 'email', Rule::unique('users', 'email')->where(fn ($q) => $q->whereNull('deleted_at'))],
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:8',
            'role' => 'required|in:admin,staff',
            'status' => 'in:active,inactive',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $validated['current_tenant_id'] = $tenant->id;

        $staff = User::create($validated);
        $staff->tenants()->attach($tenant->id, ['role' => $validated['role']]);

        return response()->json($staff, 201);
    }

    public function show(Request $request, int $staff)
    {
        $staff = $this->scopedQuery($request)->findOrFail($staff);

        return response()->json($staff);
    }

    public function update(Request $request, int $staff)
    {
        $staff = $this->scopedQuery($request)->findOrFail($staff);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => ['sometimes', 'required', 'email', Rule::unique('users', 'email')->ignore($staff->id)->where(fn ($q) => $q->whereNull('deleted_at'))],
            'phone' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:8',
            'role' => 'in:admin,staff',
            'status' => 'in:active,inactive',
        ]);

        if (! empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $staff->update($validated);

        if (! empty($validated['role'])) {
            $staff->tenants()->updateExistingPivot($request->user()->current_tenant_id, ['role' => $validated['role']]);
        }

        return response()->json($staff->fresh());
    }

    public function destroy(Request $request, int $staff)
    {
        $staff = $this->scopedQuery($request)->findOrFail($staff);
        $staff->delete();

        return response()->json(['message' => 'Staff member removed successfully.']);
    }
}

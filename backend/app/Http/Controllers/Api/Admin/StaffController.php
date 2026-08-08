<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
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

    /**
     * Merge in this staff member's role + permissions *for the caller's
     * current Library* so the edit form can prefill the permission matrix.
     * A staff member's pivot role/permissions can differ per Library, so
     * this deliberately isn't just `$staff->role`.
     */
    private function withCurrentTenantPivot(Request $request, User $staff): array
    {
        $pivot = $staff->tenants()->where('tenants.id', $request->user()->current_tenant_id)->first()?->pivot;

        return array_merge($staff->toArray(), [
            'library_role' => $pivot?->role,
            'permissions' => $pivot?->permissions ? json_decode($pivot->permissions, true) : null,
        ]);
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
        $validated = $request->validate([
            // Which Library this staff member belongs to — defaults to the
            // admin's current workspace, but an admin with several Libraries
            // can pick a different one explicitly. Validated against actual
            // membership below; never trusted outright.
            'tenant_id' => 'nullable|integer',
            'name' => 'required|string|max:255',
            // Email and phone are optional per the staff creation form — only
            // name and password are required.
            'email' => ['nullable', 'email', Rule::unique('users', 'email')->where(fn ($q) => $q->whereNull('deleted_at'))],
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:8',
            'role' => 'required|in:admin,staff',
            'status' => 'in:active,inactive',
            'permissions' => 'nullable|array',
        ]);

        $tenantId = $validated['tenant_id'] ?? $request->user()->current_tenant_id;

        if (! $request->user()->belongsToTenant((int) $tenantId)) {
            abort(403, 'You do not have access to that library.');
        }

        $tenant = Tenant::findOrFail($tenantId);

        if ($limit = $this->planLimits->limit($tenant, 'staff')) {
            if ($this->planLimits->wouldExceed($tenant, 'staff')) {
                return response()->json(['message' => $this->planLimits->limitMessage('staff', $limit)], 422);
            }
        }

        $permissions = $validated['permissions'] ?? null;
        unset($validated['tenant_id'], $validated['permissions']);

        $validated['password'] = Hash::make($validated['password']);
        $validated['current_tenant_id'] = $tenant->id;

        $staff = User::create($validated);
        $staff->tenants()->attach($tenant->id, ['role' => $validated['role'], 'permissions' => $permissions ? json_encode($permissions) : null]);

        return response()->json($this->withCurrentTenantPivot($request, $staff), 201);
    }

    public function show(Request $request, int $staff)
    {
        $staff = $this->scopedQuery($request)->findOrFail($staff);

        return response()->json($this->withCurrentTenantPivot($request, $staff));
    }

    public function update(Request $request, int $staff)
    {
        $staff = $this->scopedQuery($request)->findOrFail($staff);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => ['nullable', 'email', Rule::unique('users', 'email')->ignore($staff->id)->where(fn ($q) => $q->whereNull('deleted_at'))],
            'phone' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:8',
            'role' => 'in:admin,staff',
            'status' => 'in:active,inactive',
            'permissions' => 'nullable|array',
        ]);

        $permissions = array_key_exists('permissions', $validated) ? $validated['permissions'] : null;
        $permissionsProvided = array_key_exists('permissions', $validated);
        unset($validated['permissions']);

        if (! empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $staff->update($validated);

        $tenantId = $request->user()->current_tenant_id;
        $pivotUpdate = [];
        if (! empty($validated['role'])) {
            $pivotUpdate['role'] = $validated['role'];
        }
        if ($permissionsProvided) {
            $pivotUpdate['permissions'] = $permissions ? json_encode($permissions) : null;
        }
        if ($pivotUpdate) {
            $staff->tenants()->updateExistingPivot($tenantId, $pivotUpdate);
        }

        return response()->json($this->withCurrentTenantPivot($request, $staff->fresh()));
    }

    public function destroy(Request $request, int $staff)
    {
        $staff = $this->scopedQuery($request)->findOrFail($staff);
        $staff->delete();

        return response()->json(['message' => 'Staff member removed successfully.']);
    }
}

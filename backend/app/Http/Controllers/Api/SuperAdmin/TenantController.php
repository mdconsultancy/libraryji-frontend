<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TenantController extends Controller
{
    public function index(Request $request)
    {
        $tenants = Tenant::withCount(['users', 'halls', 'seats', 'members'])
            ->with('activeSubscription.plan')
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->search, function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('library_code', 'like', "%{$request->search}%");
            })
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15));

        return response()->json($tenants);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'library_name' => 'required|string|max:255',
            'admin_name' => 'required|string|max:255',
            // Plain `unique:` rules query the raw table and ignore the SoftDeletes
            // global scope, so a soft-deleted user/tenant's email would falsely
            // block re-registration with the same address — exclude trashed rows.
            'email' => [
                'required',
                'email',
                Rule::unique('users', 'email')->where(fn ($q) => $q->whereNull('deleted_at')),
                Rule::unique('tenants', 'email')->where(fn ($q) => $q->whereNull('deleted_at')),
            ],
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:8',
            'subscription_plan_id' => 'nullable|exists:subscription_plans,id',
            'status' => 'in:trial,active,suspended,cancelled',
        ]);

        $tenant = Tenant::create([
            'name' => $validated['library_name'],
            'slug' => Str::slug($validated['library_name']).'-'.Str::lower(Str::random(5)),
            'library_code' => Tenant::generateLibraryCode(),
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'status' => $validated['status'] ?? 'active',
            'trial_ends_at' => now()->addDays(14),
        ]);

        $tenant->users()->create([
            'role' => 'admin',
            'name' => $validated['admin_name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
            'status' => 'active',
        ]);

        if (! empty($validated['subscription_plan_id'])) {
            $tenant->subscriptions()->create([
                'subscription_plan_id' => $validated['subscription_plan_id'],
                'status' => 'active',
                'amount' => 0,
                'starts_at' => now(),
            ]);
        }

        return response()->json($tenant->load('users'), 201);
    }

    public function show(Tenant $tenant)
    {
        $tenant->load(['users', 'halls', 'subscriptions.plan'])
            ->loadCount(['members', 'halls', 'seats']);

        return response()->json($tenant);
    }

    public function update(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => ['sometimes', 'required', 'email', Rule::unique('tenants', 'email')->ignore($tenant->id)->where(fn ($q) => $q->whereNull('deleted_at'))],
            'phone' => 'nullable|string|max:20',
            'timezone' => 'nullable|string|max:100',
            'status' => 'in:trial,active,suspended,cancelled',
            'trial_ends_at' => 'nullable|date',
        ]);

        $tenant->update($validated);

        return response()->json($tenant);
    }

    public function suspend(Tenant $tenant)
    {
        $tenant->update(['status' => 'suspended']);

        return response()->json(['message' => 'Tenant suspended successfully.', 'tenant' => $tenant]);
    }

    public function activate(Tenant $tenant)
    {
        $tenant->update(['status' => 'active']);

        return response()->json(['message' => 'Tenant activated successfully.', 'tenant' => $tenant]);
    }

    public function destroy(Tenant $tenant)
    {
        $tenant->delete();

        return response()->json(['message' => 'Tenant removed successfully.']);
    }

    public function regenerateCode(Tenant $tenant)
    {
        $tenant->update(['library_code' => Tenant::generateLibraryCode()]);

        return response()->json(['tenant' => $tenant]);
    }
}

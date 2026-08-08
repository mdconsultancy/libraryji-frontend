<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Self-service signup: creates a new tenant (library) and its admin user.
     *
     * The new account is always created with role `admin` (tenant admin) —
     * `super_admin` can never be assigned through self-service registration.
     * A plan must be chosen at signup, but the tenant is created `suspended`
     * (payment-pending) — the existing EnsureTenantIsActive middleware blocks
     * all tenant-scoped access until Razorpay payment is verified via
     * PlanSelectionController::verify, which flips the tenant to `active`.
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'library_name' => 'required|string|max:255',
            'library_code' => 'nullable|string|max:50|unique:tenants,library_code',
            'established_year' => 'nullable|integer|min:1900|max:'.(now()->year + 1),
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'phone' => 'required|string|max:20',
            'alternate_phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'state' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'pincode' => 'nullable|string|max:20',
            'gst_number' => 'nullable|string|max:30',
            'password' => 'required|string|min:8|confirmed',
        ]);

        // Deliberately not a plain `unique:` validation rule: those don't
        // respect soft deletes and give the same generic "taken" message
        // whether the email belongs to a fully paid library or one that was
        // abandoned mid-checkout. We distinguish the latter so the user gets
        // pointed at "sign in and finish paying" instead of a dead end.
        $existingUser = User::where('email', $validated['email'])->first();
        if ($existingUser) {
            $existingTenant = $existingUser->tenant;
            $hasEverPaid = $existingTenant && $existingTenant->subscriptions()
                ->whereIn('status', ['active', 'trialing', 'past_due'])
                ->exists();

            if ($existingTenant && ! $hasEverPaid && in_array($existingTenant->status, ['suspended', 'trial'], true)) {
                throw ValidationException::withMessages([
                    'email' => ['An account with this email is already registered and awaiting payment. Please sign in with your Library Code ('.$existingTenant->library_code.') to complete payment.'],
                ]);
            }

            throw ValidationException::withMessages([
                'email' => ['The email has already been taken.'],
            ]);
        }

        if (Tenant::where('email', $validated['email'])->exists()) {
            throw ValidationException::withMessages([
                'email' => ['The email has already been taken.'],
            ]);
        }

        [$tenant, $user] = DB::transaction(function () use ($validated) {
            $slug = Str::slug($validated['library_name']).'-'.Str::lower(Str::random(5));

            $tenant = Tenant::create([
                'name' => $validated['library_name'],
                'slug' => $slug,
                'library_code' => $validated['library_code'] ?? Tenant::generateLibraryCode(),
                'established_year' => $validated['established_year'] ?? null,
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'alternate_phone' => $validated['alternate_phone'] ?? null,
                'address' => $validated['address'] ?? null,
                'state' => $validated['state'] ?? null,
                'city' => $validated['city'] ?? null,
                'pincode' => $validated['pincode'] ?? null,
                'gst_number' => $validated['gst_number'] ?? null,
                'status' => 'suspended',
                'trial_ends_at' => null,
            ]);

            $user = User::create([
                'tenant_id' => $tenant->id,
                'role' => 'admin',
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'password' => Hash::make($validated['password']),
                'status' => 'active',
            ]);

            return [$tenant, $user];
        });

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'tenant' => $tenant,
            'token' => $token,
        ], 201);
    }

    /**
     * Library-code-scoped login. Super admins (no tenant) skip the library
     * code check entirely; admin/staff must supply the correct code for the
     * library their account belongs to — this is validated before the
     * password so a wrong code never leaks whether the email exists in a
     * *different* library.
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'library_code' => 'nullable|string|max:10',
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if ($user && $user->role !== 'super_admin') {
            if (empty($validated['library_code'])) {
                throw ValidationException::withMessages([
                    'library_code' => ['Library Code is required.'],
                ]);
            }

            $tenant = Tenant::where('library_code', strtoupper($validated['library_code']))->first();

            if (! $tenant) {
                throw ValidationException::withMessages([
                    'library_code' => ['Invalid Library Code.'],
                ]);
            }

            if ($user->tenant_id !== $tenant->id) {
                throw ValidationException::withMessages([
                    'email' => ['This account does not belong to the specified library.'],
                ]);
            }
        }

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if ($user->status !== 'active') {
            throw ValidationException::withMessages([
                'email' => ['Your account has been deactivated.'],
            ]);
        }

        $user->forceFill([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ])->save();

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user->load('tenant.activeSubscription.plan'),
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user()->load('tenant.activeSubscription.plan'),
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'current_password' => 'nullable|string',
            'password' => 'nullable|string|min:8|confirmed',
        ]);

        if (! empty($validated['password'])) {
            if (empty($validated['current_password']) || ! Hash::check($validated['current_password'], $user->password)) {
                throw ValidationException::withMessages([
                    'current_password' => ['The current password is incorrect.'],
                ]);
            }
            $user->password = Hash::make($validated['password']);
        }

        $user->fill([
            'name' => $validated['name'] ?? $user->name,
            'phone' => $validated['phone'] ?? $user->phone,
        ])->save();

        return response()->json(['user' => $user->fresh('tenant')]);
    }
}

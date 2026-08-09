<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use App\Services\JwtService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(private JwtService $jwt) {}

    /**
     * Self-service signup: creates a new tenant (library) and its admin user.
     *
     * The new account is always created with role `admin` (tenant admin) —
     * `super_admin` can never be assigned through self-service registration.
     * A plan must still be chosen after signup — the tenant is created with
     * status `trial` and `trial_ends_at` left null, which EnsureTenantIsActive
     * treats as "no active trial yet" and blocks all tenant-scoped access
     * until a plan is picked via PlanSelectionController::startTrial (free,
     * immediate, 1 month) or ::verify (Razorpay, once the trial is used up).
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
            $existingTenant = $existingUser->currentTenant;
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
                'status' => 'trial',
                'trial_ends_at' => null,
            ]);

            $user = User::create([
                'current_tenant_id' => $tenant->id,
                'role' => 'admin',
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'password' => Hash::make($validated['password']),
                'status' => 'active',
            ]);

            $user->tenants()->attach($tenant->id, ['role' => 'admin']);

            return [$tenant, $user];
        });

        return response()->json([
            'user' => $user,
            'tenant' => $tenant,
            ...$this->jwt->issuePair($user, $request),
        ], 201);
    }

    /**
     * Library-code-scoped login. Super admins (no tenant) skip the library
     * code check entirely.
     *
     * Admin/staff accounts are validated against their `tenant_user`
     * memberships — never the old single `tenant_id` — before the password
     * check, so a wrong code never leaks whether the email exists in a
     * *different* library:
     *  - `library_code` given: the account must have a membership for that
     *    Library, and that becomes the selected workspace.
     *  - `library_code` omitted: reuse whichever Library the admin had
     *    selected last session (`current_tenant_id`), as long as they still
     *    have a membership there, so returning admins land back where they
     *    left off instead of being reset on every login. Falls back to
     *    their first Library if there's no (still-valid) saved one — e.g.
     *    the very first login, or access to the saved one was revoked.
     *    There's deliberately no "pick a library" screen at login; a
     *    multi-library admin switches afterwards via the header dropdown.
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'library_code' => 'nullable|string|max:10',
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        $pendingTenantId = null;

        if ($user && $user->role !== 'super_admin') {
            if (! empty($validated['library_code'])) {
                $tenant = Tenant::where('library_code', strtoupper($validated['library_code']))->first();

                if (! $tenant) {
                    throw ValidationException::withMessages([
                        'library_code' => ['Invalid Library Code.'],
                    ]);
                }

                if (! $user->belongsToTenant($tenant->id)) {
                    throw ValidationException::withMessages([
                        'email' => ['This account does not belong to the specified library.'],
                    ]);
                }

                $pendingTenantId = $tenant->id;
            } else {
                $memberships = $user->tenants;

                if ($memberships->isEmpty()) {
                    throw ValidationException::withMessages([
                        'email' => ['This account is not linked to any library. Please contact support.'],
                    ]);
                }

                $pendingTenantId = $user->current_tenant_id && $memberships->contains('id', $user->current_tenant_id)
                    ? $user->current_tenant_id
                    : $memberships->first()->id;
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
        ]);

        if ($pendingTenantId) {
            $user->current_tenant_id = $pendingTenantId;
        }

        $user->save();

        return response()->json([
            'user' => $user->load('currentTenant.activeSubscription.plan', 'tenants'),
            ...$this->jwt->issuePair($user, $request),
        ]);
    }

    /**
     * Exchanges a still-valid refresh token for a new access/refresh pair.
     * Not behind auth:jwt — the access token has typically already expired
     * by the time the frontend calls this, so the refresh token itself
     * (validated here) is the only credential available.
     */
    public function refresh(Request $request)
    {
        $validated = $request->validate([
            'refresh_token' => 'required|string',
        ]);

        $refreshToken = $this->jwt->findValidRefreshToken($validated['refresh_token']);

        if (! $refreshToken) {
            throw ValidationException::withMessages([
                'refresh_token' => ['Your session has expired. Please sign in again.'],
            ]);
        }

        return response()->json($this->jwt->rotate($refreshToken, $request));
    }

    public function logout(Request $request)
    {
        $refreshToken = $request->string('refresh_token')->toString();

        if ($refreshToken !== '') {
            $this->jwt->revoke($refreshToken);
        }

        return response()->json(['message' => 'Logged out successfully.']);
    }

    /**
     * Switch the current Library workspace. Admin-only, and only among
     * Libraries the admin actually has a `tenant_user` membership for —
     * enforced here regardless of what the client sends. Staff never has
     * more than one Library and is rejected outright, even if it (somehow)
     * sends a `tenant_id` it does have a membership for.
     */
    public function selectLibrary(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'admin') {
            abort(403, 'Only library owners can switch libraries.');
        }

        $validated = $request->validate([
            'tenant_id' => 'required|integer|exists:tenants,id',
        ]);

        if (! $user->belongsToTenant((int) $validated['tenant_id'])) {
            abort(403, 'You do not have access to this library.');
        }

        $user->current_tenant_id = $validated['tenant_id'];
        $user->save();

        return response()->json([
            'user' => $user->fresh()->load('currentTenant.activeSubscription.plan', 'tenants'),
        ]);
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user()->load('currentTenant.activeSubscription.plan', 'tenants'),
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

        return response()->json(['user' => $user->fresh('currentTenant')]);
    }
}

# Multi-Library SaaS Architecture Refactor — Task Plan

## Goal
Move from `1 Admin -> 1 Tenant (fixed users.tenant_id)` to:
`Super Admin -> Admin (owns N Libraries via pivot) -> Library -> Staff (belongs to exactly 1 Library)`,
with a "current Library / workspace" concept, strict server-side authorization
(never trust client-supplied tenant/library IDs), and per-Library subscriptions.

## Current-state findings (as inspected 2026-08-08)
- DB: MySQL, **0 tenants, 1 user (super_admin) — no real tenant data exists yet**, so
  no risky data backfill is needed. Safe to change schema now.
- `users.tenant_id` (nullable FK) + `users.role` (enum: super_admin/admin/staff/member)
  is the *only* tenant link today. `App\Models\Scopes\TenantScope` (a global scope
  applied via `App\Models\Concerns\BelongsToTenant`) filters every scoped model's
  queries by `Auth::user()->tenant_id` (bypassed for `super_admin`).
  `BelongsToTenant::bootBelongsToTenant()` also auto-fills `tenant_id` on create.
- Models using `BelongsToTenant`: `User`, `Member`, plus (per grep) `Hall`, `Seat`,
  `Shift`, `MembershipPlan`, `MemberSubscription`, `Attendance`, `Payment`, `Expense`.
  `AuditLog` and `Tenant`/`TenantSubscription` do NOT use it (manual/no tenant scoping).
- Login (`AuthController::login`) is library-code-scoped: requires `library_code` for
  non-super-admins and hard-checks `$user->tenant_id === $tenant->id`. `register()`
  creates exactly one Tenant + one Admin user (1:1, hardcoded).
  `users.email` is globally unique across the whole platform (virtual generated
  column trick in `2026_08_07_190000_...` migration) — one email = one account.
- `StaffController` has **no explicit tenant scoping in code** — it relies entirely
  on the `User` model's global `TenantScope`. `PlanLimitService::currentCount('staff')`
  queries `User::where('tenant_id', $tenant->id)`.
- `UserManagementController` (super admin) lists `User::where('role','admin')->with('tenant')`
  — assumes 1 tenant per admin.
- Frontend: Next.js. `AuthContext.tsx` stores `user` (typed in `types/index.ts` with
  `tenant_id: number | null` and `tenant?: Tenant`), no library-switcher concept yet.
  Login form already collects `library_code`.

## Key design decision
`users` keeps a `current_tenant_id` column (renamed from `tenant_id`) that represents
the **currently selected workspace**, not ownership. Ownership/membership is tracked
in a new `tenant_user` pivot table (`tenant_id`, `user_id`, `role`). Business-data
models (Hall/Seat/Member/etc.) keep scoping by `Auth::user()->current_tenant_id`
(unchanged mechanism, just renamed column) — this is what "current Library" means.
**The `User` model itself stops using `BelongsToTenant`/`TenantScope`**, because a
`User` row can legitimately be visible/attached to more than one Library via the
pivot; anywhere that needs "staff of Library X" now queries the pivot explicitly
(`$tenant->users()`), not the old single-column filter. This was found necessary
during research — a naive "just rename the column" approach would silently break
staff/user listings for multi-library admins.

Every switch-of-library and every login goes through server-side pivot-membership
verification before `current_tenant_id` is changed — client never supplies a trusted
tenant/library id for scoping.

## Task list (execute one by one, commit after each)

- [x] 0. Inspect current schema/models/auth/scoping (this document).
- [x] 0.1 `git init` + baseline commit as a rollback safety net (no VCS existed).
- [x] 1. Migration: create `tenant_user` pivot table (tenant_id, user_id, role, timestamps, unique(tenant_id,user_id)).
- [x] 2. Migration: add `users.current_tenant_id` (nullable FK -> tenants, nullOnDelete), backfill from `tenant_id` + backfill `tenant_user` from existing `tenant_id`/`role`, then drop `users.tenant_id`.
- [x] 3. Models: `User` — drop `BelongsToTenant`, add `tenants()` (belongsToMany w/ pivot role+timestamps), `currentTenant()` (belongsTo via current_tenant_id), helper `belongsToTenant()`; update `#[Fillable]`. `Tenant` — change `users()` to belongsToMany via pivot; add `staff()`/`admins()` helpers as needed.
- [x] 4. `BelongsToTenant` trait + `TenantScope`: read `current_tenant_id` instead of `tenant_id`.
- [x] 5. Auth: `AuthController::register` (create pivot row + current_tenant_id), `login` (pivot-based membership check, auto-select single library, multi-library -> needs-selection response), new `selectLibrary` endpoint (admin-only, staff gets 403 even if it belongs to the target library), `me` (include libraries list). Routes for the new endpoint.
- [x] 6. Middleware `EnsureTenantIsActive`: use `currentTenant`, add explicit pivot-membership re-check (defense in depth), clearer message when no library selected yet.
- [x] 7. `StaffController`: explicit pivot-based scoping (index/show/update/destroy verify membership in current tenant), `store` creates user + pivot row scoped to admin's current library.
- [x] 8. `PlanLimitService::currentCount('staff')`: pivot-based count instead of `tenant_id` column.
- [x] 9. `UserManagementController` (super admin): list admins with all their libraries (via pivot, withCount), `show()` drill-down across all owned libraries.
- [x] 10. Sweep remaining `Auth::user()->tenant`/`tenant_id` references app-wide (BillingController, MemberController, TenantSettingsController, PaymentController, SeatController, PlanSelectionController, DatabaseSeeder) — confirmed zero remaining via grep, `php -l` clean on all changed files, `route:list` resolves.
- [x] 10.1 Tinker smoke test (rolled back transaction): 2-library admin, pivot membership true/false checks, per-library staff isolation via pivot count, business-data (Hall) TenantScope isolation across workspace switch — all assertions passed.
- [ ] 11. Frontend: `types/index.ts` (`current_tenant_id`, `tenants[]` w/ pivot role), `AuthContext` (`selectLibrary`, needs-selection handling), Library Switcher UI in header (admin-only, hidden for staff), Login flow update for multi-library selection screen, super-admin User Management UI for multiple libraries per admin.
- [ ] 12. Manual smoke test in the browser: register -> becomes admin+library A; simulate 2nd library for same admin; login flows (single lib auto-select, multi-lib selector, switch-library); staff created in Library A invisible from Library B; verify tampering with a foreign tenant/library id is rejected server-side; confirm staff never sees the switcher and gets 403 if it calls select-library directly.

## Non-goals / explicitly out of scope (per "minimum required changes")
- No changes to Branches (not present in current schema — Hall is the top sub-unit).
- No change to Member (customer) model/portal — members already belong to exactly one tenant, unaffected by the Admin/Staff hierarchy change.
- No change to subscription billing logic beyond confirming `tenant_subscriptions` stays per-Library (already true — no change needed there).

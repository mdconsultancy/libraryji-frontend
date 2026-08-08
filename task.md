# Task Plan

> Phase 1 (multi-library SaaS architecture: Admin -> N Libraries, tenant_user pivot,
> workspace switching, staff isolation) is done and committed — see git log
> (`Backend: Admin -> multiple Libraries architecture`, `Frontend: multi-library
> workspace support...`). This file now tracks Phase 2.

# Phase 2: Branding centralization, Library Admin menu rework, Staff permissions

Three requests tracked together since they touch overlapping files (sidebar, staff, settings).

## Findings before starting
- Theme assets (`logo_path`/`favicon_path`) already upload correctly to `platform_settings` (group=theme) via `SettingsController::uploadThemeAsset` — the bug is that nothing on the frontend ever reads them back. `FullLogo.tsx` is hardcoded to a static `/images/logos/dark-logo.svg`, and the favicon is a static `<link>` in the root layout (`/favicon.svg`). No public endpoint exists to read theme settings without a super_admin token, which the login page and every non-super-admin panel need.
- No "Branch" menu item exists anywhere in `Sidebaritems.ts` today — the closest existing thing is "Library Settings" (Administration section, `/settings`, backed by `TenantSettingsController`, already scoped to the admin's current Library). Treating "replace Branch with Library" as **rename "Library Settings" -> "Library"**, same page — it already does what's asked (view/manage the assigned Library).
- Sidebar has two different "Subscription(s)": `Members -> Subscriptions` (`/subscriptions`, **member/student** membership-plan subscriptions — real business data, unrelated to SaaS billing) and `Administration -> Subscription` (`/billing`, the Library's own SaaS plan — this is what "My Plan & Subscription" means). Assumption: rename the billing one to "My Plan & Subscription"; remove the *member*-subscriptions item from the top-level sidebar per the literal instruction ("remove the separate Subscriptions menu"), but leave its route/controller intact (not deleted, just unlinked from top nav) since hiding a nav link is cheap to reverse if that reading is wrong.
- Payments create form **already has** an optional member selector ("Member (optional)" / "No member" option) — that requirement is already satisfied, no change needed there.
- Hall create form has no Library selector at all (relies entirely on the ambient `current_tenant_id` workspace). Needs an explicit dropdown sourced from the admin's `tenants` memberships.
- Staff create form currently: email required (needs to become optional), no password generator, no library selection (implicit via current workspace only), no permissions UI at all. Backend `StaffController` has no concept of granular permissions.

## Design decisions
- **Permissions storage**: add a `permissions` JSON column to the `tenant_user` pivot (per staff-per-Library, matching the existing role-per-Library model). Shape: `{"library":{"view":bool,"edit":bool}, "halls":{"view":,"add":,"edit":,"delete":}, "members":{...}, "payments":{...}}`.
- **Scope of enforced modules**: exactly the 4 modules in the user's example table — Library, Halls, Members, Payments. (Library is a singleton settings resource, so only `view`/`edit` apply there, not `add`/`delete`.)
- **Who's restricted**: `admin` and `super_admin` always pass every permission check (full access — matches "without affecting Super Admin functionality" and the existing "admin owns/manages" model). Only `staff` rows are actually gated by their stored permissions.
- **Enforcement layer**: new `permission:{module},{action}` middleware, applied per HTTP verb (can't infer view/add/edit/delete from a shared `apiResource` line), checked against the *current tenant's* `tenant_user.permissions` row — never a client-supplied value.
- **Frontend**: permissions for the logged-in user's current Library come back on `tenants[].pivot.permissions` (extend the existing pivot load); a small `usePermission(module, action)` hook drives button/section visibility, treating `admin`/`super_admin` as always-allowed to mirror the backend.

## Task list

### Part A — Centralized Logo & Favicon
- [ ] A1. Backend: new public `GET /theme` route (no auth) returning `{ logo_url, favicon_url, site_name, primary_color }` derived from `platform_settings` group=theme, safe to expose pre-login.
- [ ] A2. Frontend: `ThemeContext`/hook fetching `/theme` once; `FullLogo.tsx` uses it (falls back to the existing static SVG when no logo uploaded) instead of a hardcoded path.
- [ ] A3. Frontend: dynamic favicon — small client component in the root layout that sets the `<link rel="icon">` href from the fetched theme once available; static `/favicon.svg` stays the fallback.
- [ ] A4. Verify: super_admin uploads a new logo/favicon in Theme settings -> reflected on login page, Admin panel, Staff panel without a rebuild, survives refresh/logout/login.

### Part B — Library Admin menu & functionality
- [ ] B1. Sidebar: rename "Library Settings" -> "Library"; remove `Members -> Subscriptions` top-level item (route stays, just unlinked); rename `Administration -> Subscription` -> "My Plan & Subscription"; remove `Members -> Attendance` item. Keep Dashboard, Halls/Seats/Shifts/Membership Plans, Payments, Staff as-is.
- [ ] B2. Hall create/edit form: add a "Library" select populated from the admin's `tenants`, defaulting to (and, for a single-library admin, locked to) the current workspace; `HallController::store` accepts and validates an explicit `tenant_id` against the caller's membership instead of only the ambient one.
- [ ] B3. Members page: relabel to "Members / Students" and surface the total count prominently (stat above the table, using the existing pagination `total`).
- [ ] B4. Billing/"My Plan & Subscription" page: already shows current plan + Change/Renew Plan link — just confirm the rename covers it, no functional change needed.

### Part C — Staff creation with granular permissions
- [ ] C1. Migration: add `permissions` JSON column to `tenant_user`.
- [ ] C2. Backend: `EnsurePermission` middleware (module, action) — full pass for admin/super_admin, pivot-lookup check for staff; register alias.
- [ ] C3. Backend: split the `halls`/`members`/`payments` `apiResource` routes (and `tenant-settings` show/update) into explicit per-verb routes carrying `permission:module,action`; `StaffController::store`/`update` accept + persist a `permissions` object into the `tenant_user` pivot row alongside `role`.
- [ ] C4. Backend: `User::tenants()` pivot load includes `permissions`; expose via `/auth/me` (already loads `tenants`).
- [ ] C5. Frontend: `usePermission(module, action)` hook; Staff form reworked — Library select (required), Name (required), Email (optional), Phone (optional), Password (required) + Generate Password button, and a permission matrix (4 modules x up to 4 actions) as checkboxes.
- [ ] C6. Frontend: gate Add/Edit/Delete buttons and page-level view access on Halls, Members, Payments, Library(Settings) pages behind `usePermission`.
- [ ] C7. Verify: create a staff member with only `Members -> view+add`; confirm Edit/Delete hidden on Members, Halls/Payments pages inaccessible, and that hitting the underlying API routes directly (not just hiding UI) 403s.

Execution order: A -> B -> C -> D (C is the largest; B2/B3 touch files C6 will touch again, doing them first avoids rework).

### Part D — Subscription-driven Library limit

New request that arrived mid-Phase-2. Confirmed with the user: **"best active plan wins"** — an
Admin's total allowed Library count = `MAX(max_libraries)` across all of their *currently active*
(`active`/`trialing`) per-Library subscriptions, not a sum and not just the first one. Upgrading
any one Library's plan raises the shared account-wide cap immediately.

- [ ] D1. Migration + model: add `max_libraries` (nullable int, null = unlimited) to `subscription_plans`; update `SubscriptionPlan` fillable/casts, the super-admin Subscription Plans create/edit form, and `SubscriptionPlan` frontend type.
- [ ] D2. Backend: `GET /admin/libraries-summary` (admin-only) -> `{used, limit, remaining, exceeded}` — `used` = count of Libraries the admin belongs to (role=admin, any status), `limit` = MAX(max_libraries) over their active subscriptions (null/unlimited if any active plan has no cap).
- [ ] D3. Backend: `POST /admin/libraries` — creates an *additional* Library for the already-authenticated admin (reuses the account; does NOT create a new User, unlike `/auth/register`), 422s if at limit, attaches `tenant_user` (role=admin), sets it as the new `current_tenant_id` so the existing PlanSelectionController payment flow applies to it immediately afterward. New Library starts `suspended` (payment-pending), same as registration.
- [ ] D4. Frontend: header "Libraries X/Y" indicator (admin-only, next to the Library Switcher) — a "+" button opening a small "New Library" dialog (posts to `/admin/libraries`, then redirects into `/select-plan` to complete first payment for it) when under limit, or an "Upgrade Plan" button linking to the existing `/select-plan?upgrade=1` flow when at limit. Reuses the existing select-plan component/page as-is rather than rebuilding it inside the dashboard shell (it already has a "Back to Dashboard" exit) — noting this as the minimal-diff reading of "open the existing Plan component."
- [ ] D5. Verify: `PlanLimitService` (seats/members/staff) and the account-wide library cap both already recompute live off `tenant->activeSubscription->plan` / the admin's active subscriptions — no extra "propagate the upgrade" step should be needed, confirm this holds after D1-D4. Confirm Super Admin User Management already surfaces `activeSubscription.plan` per Library (it does, from Phase 1) so the new `max_libraries` value is visible there for free once D1 lands.

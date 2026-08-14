import type { Tenant } from "@/types";

/** Mirrors the backend's EnsureTenantIsActive middleware so the UI can gate proactively.
 *  Full-screen block: suspended/cancelled, or never picked a plan at all
 *  (trial_ends_at null) — there's nothing built yet to view read-only in
 *  that case, unlike an expired trial that already has real data in it. */
export function tenantNeedsPlan(tenant: Tenant | null | undefined): boolean {
  if (!tenant) return false;
  if (tenant.status === "suspended" || tenant.status === "cancelled") return true;
  if (tenant.status === "trial" && !tenant.trial_ends_at) return true;
  return false;
}

/** Trial was chosen and has now run out — softer than tenantNeedsPlan:
 *  browsing existing data stays allowed, only writes get blocked (see
 *  EnsureTenantIsActive on the backend, which enforces the same split). */
export function tenantIsReadOnly(tenant: Tenant | null | undefined): boolean {
  if (!tenant) return false;
  if (tenant.status !== "trial") return false;
  if (!tenant.trial_ends_at) return false;
  return new Date(tenant.trial_ends_at) < new Date();
}

/** One-time post-registration wizard (library details + Halls/Seats) — shown once, before the plan gate. */
export function tenantNeedsOnboarding(tenant: Tenant | null | undefined): boolean {
  return !!tenant && !tenant.onboarding_completed_at;
}

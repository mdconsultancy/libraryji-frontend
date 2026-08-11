import type { Tenant } from "@/types";

/** Mirrors the backend's EnsureTenantIsActive middleware so the UI can gate proactively. */
export function tenantNeedsPlan(tenant: Tenant | null | undefined): boolean {
  if (!tenant) return false;
  if (tenant.status === "suspended" || tenant.status === "cancelled") return true;
  // "trial" status covers both "never picked a plan yet" (trial_ends_at
  // null) and "the free month ran out" (trial_ends_at in the past) — both
  // need gating, not just the expiry case.
  if (tenant.status === "trial" && (!tenant.trial_ends_at || new Date(tenant.trial_ends_at) < new Date())) return true;
  return false;
}

/** One-time post-registration wizard (library details + Halls/Seats) — shown once, before the plan gate. */
export function tenantNeedsOnboarding(tenant: Tenant | null | undefined): boolean {
  return !!tenant && !tenant.onboarding_completed_at;
}

import type { Tenant } from "@/types";

/** Mirrors the backend's EnsureTenantIsActive middleware so the UI can gate proactively.
 *  Full-screen block: suspended/cancelled, never picked a plan at all
 *  (trial_ends_at null), or the current trial/free/paid plan has expired —
 *  renewal is mandatory, the API rejects every tenant request until then. */
export function tenantNeedsPlan(tenant: Tenant | null | undefined): boolean {
  if (!tenant) return false;
  if (tenant.status === "suspended" || tenant.status === "cancelled") return true;
  if (tenant.status === "trial" && !tenant.trial_ends_at) return true;
  return tenantPlanExpired(tenant);
}

/** Trial, free plan or paid plan has run out. Uses the backend's computed
 *  `plan_expired` flag, plus a client-side trial check so a session left
 *  open past the expiry moment gets gated without needing a fresh /auth/me. */
export function tenantPlanExpired(tenant: Tenant | null | undefined): boolean {
  if (!tenant) return false;
  if (tenant.plan_expired) return true;
  if (tenant.status === "trial" && tenant.trial_ends_at) {
    return new Date(tenant.trial_ends_at) < new Date();
  }
  const endsAt = tenant.status === "active" ? tenant.active_subscription?.ends_at : null;
  if (endsAt) {
    const end = new Date(endsAt);
    end.setHours(23, 59, 59, 999);
    return end < new Date();
  }
  return false;
}

/** Expired plans are now a hard renewal gate (tenantNeedsPlan) rather than
 *  a read-only mode, so there is no read-only state left to show. Kept so
 *  existing callers (useReadOnly, ReadOnlyBanner) keep compiling. */
export function tenantIsReadOnly(_tenant: Tenant | null | undefined): boolean {
  return false;
}

/** One-time post-registration wizard (library details + Halls/Seats) — shown once, before the plan gate. */
export function tenantNeedsOnboarding(tenant: Tenant | null | undefined): boolean {
  return !!tenant && !tenant.onboarding_completed_at;
}

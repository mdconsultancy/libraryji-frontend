import type { Tenant } from "@/types";

/** Mirrors the backend's EnsureTenantIsActive middleware so the UI can redirect proactively. */
export function tenantNeedsPlan(tenant: Tenant | null | undefined): boolean {
  if (!tenant) return false;
  if (tenant.status === "suspended" || tenant.status === "cancelled") return true;
  if (tenant.status === "trial" && tenant.trial_ends_at && new Date(tenant.trial_ends_at) < new Date()) return true;
  return false;
}

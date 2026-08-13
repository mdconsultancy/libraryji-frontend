import type { Tenant } from "@/types";

export function daysUntil(dateStr: string): number {
  const ms = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

/** Humanizes a day count the way the plan badge/billing page shows it:
 *  under 30 days → days, under a year → months, a year or more → years. */
export function formatDaysLeft(days: number): string {
  if (days < 0) return "Expired";
  if (days === 0) return "Expires today";
  if (days >= 365) {
    const years = Math.round(days / 365);
    return `${years} year${years === 1 ? "" : "s"} left`;
  }
  if (days >= 30) {
    const months = Math.round(days / 30);
    return `${months} month${months === 1 ? "" : "s"} left`;
  }
  return `${days} day${days === 1 ? "" : "s"} left`;
}

export interface PlanStatus {
  isTrial: boolean;
  expired: boolean;
  expiryDate: string | null;
  daysLeft: number | null;
  label: string;
}

/** Single source of truth for "is this tenant on a trial or a real plan, and
 *  how much runway is left" — used by both the header badge and the Billing
 *  page's header card so they never disagree with each other. */
export function getPlanStatus(tenant: Tenant | null | undefined): PlanStatus | null {
  if (!tenant) return null;

  const isTrial = tenant.status === "trial";
  const expiryDate = isTrial ? tenant.trial_ends_at : tenant.active_subscription?.ends_at ?? null;
  if (!expiryDate) return null;

  const daysLeft = daysUntil(expiryDate);
  const expired = daysLeft < 0;
  const label = isTrial ? `Trial · ${formatDaysLeft(daysLeft)}` : formatDaysLeft(daysLeft);

  return { isTrial, expired, expiryDate, daysLeft, label };
}

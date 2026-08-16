"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { usePlanCheckout } from "@/hooks/usePlanCheckout";
import { normalizePlanFeatures } from "@/lib/planFeatures";
import type { SubscriptionPlan } from "@/types";

interface PlanPickerProps {
  /** Explicit opt-in upgrade (an already-active tenant hit a limit) vs. the forced "no active plan" gate. */
  isUpgrading?: boolean;
  /** Called after a trial starts or payment verifies — caller decides what happens next (navigate, just let the gate re-check, etc). */
  onActivated?: () => void;
  /** Only the forced gate offers a logout escape hatch; the voluntary upgrade flow offers "back to dashboard" instead (handled by the page itself). */
  showLogout?: boolean;
}

const cycleLabel = (cycle: string) =>
  cycle === "yearly" ? "1 year" : cycle === "quarterly" ? "3 months" : "1 month";

const validityLabel = (cycle: string) =>
  cycle === "yearly" ? "12 Months" : cycle === "quarterly" ? "3 Months" : "1 Month";

// Each plan gets its own accent color (cycled by position) so the grid reads
// as distinct tiers at a glance instead of identical white cards — mirrors
// the reference pricing-page design (green/blue/purple/amber/rose).
const ACCENTS: Record<string, {
  icon: string;
  iconBg: string;
  name: string;
  price: string;
  discountBg: string;
  button: string;
  border: string;
  ring: string;
  check: string;
}> = {
  emerald: {
    icon: "solar:rocket-2-bold-duotone",
    iconBg: "bg-emerald-500",
    name: "text-emerald-600 dark:text-emerald-400",
    price: "text-emerald-600 dark:text-emerald-400",
    discountBg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    button: "bg-emerald-500 hover:bg-emerald-600",
    border: "border-emerald-300 dark:border-emerald-500/40",
    ring: "ring-emerald-400/30",
    check: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
  blue: {
    icon: "solar:chart-2-bold-duotone",
    iconBg: "bg-blue-500",
    name: "text-blue-600 dark:text-blue-400",
    price: "text-blue-600 dark:text-blue-400",
    discountBg: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    button: "bg-blue-500 hover:bg-blue-600",
    border: "border-blue-300 dark:border-blue-500/40",
    ring: "ring-blue-400/30",
    check: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
  },
  violet: {
    icon: "solar:crown-bold-duotone",
    iconBg: "bg-violet-500",
    name: "text-violet-600 dark:text-violet-400",
    price: "text-violet-600 dark:text-violet-400",
    discountBg: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    button: "bg-violet-500 hover:bg-violet-600",
    border: "border-violet-300 dark:border-violet-500/40",
    ring: "ring-violet-400/30",
    check: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
  },
  amber: {
    icon: "solar:star-bold-duotone",
    iconBg: "bg-amber-500",
    name: "text-amber-600 dark:text-amber-400",
    price: "text-amber-600 dark:text-amber-400",
    discountBg: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    button: "bg-amber-500 hover:bg-amber-600",
    border: "border-amber-300 dark:border-amber-500/40",
    ring: "ring-amber-400/30",
    check: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  },
  rose: {
    icon: "solar:shield-star-bold-duotone",
    iconBg: "bg-rose-500",
    name: "text-rose-600 dark:text-rose-400",
    price: "text-rose-600 dark:text-rose-400",
    discountBg: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    button: "bg-rose-500 hover:bg-rose-600",
    border: "border-rose-300 dark:border-rose-500/40",
    ring: "ring-rose-400/30",
    check: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
  },
};
const ACCENT_ORDER = ["emerald", "blue", "violet", "amber", "rose"];

// The ribbon's color/icon is inferred from the admin-entered badge text
// (e.g. "1 Month Free Trial" -> green, "Limited Time Offer" -> red,
// "Best Value" -> amber) so it carries the same at-a-glance urgency/appeal
// cue as the reference design without adding a new admin-facing field.
function ribbonTone(badgeText: string): { bg: string; icon: string } {
  const t = badgeText.toLowerCase();
  if (t.includes("free") || t.includes("trial")) return { bg: "bg-emerald-500", icon: "solar:gift-bold" };
  if (t.includes("limit") || t.includes("offer") || t.includes("sale")) return { bg: "bg-rose-500", icon: "solar:fire-bold" };
  if (t.includes("best") || t.includes("popular") || t.includes("value")) return { bg: "bg-amber-500", icon: "solar:star-bold" };
  return { bg: "bg-primary", icon: "solar:medal-ribbon-star-bold" };
}

export function PlanPicker({ isUpgrading = false, onActivated, showLogout = false }: PlanPickerProps) {
  const { user, refreshMe, logout } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const { pay: handlePay, payingId } = usePlanCheckout(onActivated);
  const [activatingId, setActivatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: plansData, isLoading: loadingPlans } = useApi<SubscriptionPlan[]>("/plans");
  const plans = plansData ?? [];

  // While a higher-priced plan is active, cheaper plans are locked — an
  // active_subscription only exists while trialing/active (not once
  // expired), so this naturally stops applying once the plan lapses and
  // everything becomes pickable again for renewal.
  const currentPlanPrice = isUpgrading ? Number(user?.current_tenant?.active_subscription?.plan?.price ?? 0) : 0;

  // Same "renew only in the last week" window as the billing page's Current
  // Plan card — renewing with weeks still left doesn't extend the existing
  // plan, it just creates a confusing extra subscription row.
  const RENEW_WINDOW_DAYS = 7;
  const activeEndsAt = user?.current_tenant?.active_subscription?.ends_at;
  const activeDaysLeft = activeEndsAt ? Math.ceil((new Date(activeEndsAt).getTime() - Date.now()) / 86400000) : null;
  const canRenewNow = activeDaysLeft === null || activeDaysLeft <= RENEW_WINDOW_DAYS;

  // Free (₹0) plans activate directly for their own billing-cycle duration —
  // no payment step, and not a one-time-ever freebie: any ₹0 plan can be
  // (re)activated this way once the current period is over/about to end.
  const handleActivateFree = async (plan: SubscriptionPlan) => {
    if (isUpgrading && currentPlanPrice > 0 && Number(plan.price) < currentPlanPrice) return;
    setActivatingId(plan.id);
    setError(null);
    try {
      await api.post("/admin/select-plan/trial", { subscription_plan_id: plan.id });
      await refreshMe();
      toast.success(`${plan.name} is now active for ${cycleLabel(plan.billing_cycle)} — completely free.`);
      onActivated?.();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Unable to activate this plan. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setActivatingId(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  return (
    <div className="w-full">
      {error && <p className="text-center text-sm text-error mb-4">{error}</p>}

      {loadingPlans ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-96 rounded-2xl bg-white/60 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch pt-3">
          {plans.map((plan, index) => {
            const features = normalizePlanFeatures(plan.features);
            const isCurrentPlan = isUpgrading && user?.current_tenant?.active_subscription?.subscription_plan_id === plan.id;
            const isLockedDowngrade = !isCurrentPlan && currentPlanPrice > 0 && Number(plan.price) < currentPlanPrice;
            const busy = payingId !== null || activatingId !== null;
            const isFree = Number(plan.price) === 0;
            const originalPrice = plan.original_price ? Number(plan.original_price) : null;
            const discountPct = originalPrice && originalPrice > Number(plan.price)
              ? Math.round((1 - Number(plan.price) / originalPrice) * 100)
              : null;
            const accent = ACCENTS[ACCENT_ORDER[index % ACCENT_ORDER.length]];

            const ribbon = isCurrentPlan
              ? { bg: "bg-primary", icon: "solar:check-circle-bold", label: "Current Plan" }
              : isLockedDowngrade
              ? { bg: "bg-slate-500", icon: "solar:lock-bold", label: "Locked" }
              : plan.badge_text
              ? { ...ribbonTone(plan.badge_text), label: plan.badge_text }
              : null;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl bg-white dark:bg-darkgray shadow-md hover:shadow-xl transition-shadow duration-200 overflow-visible border-2 ${
                  isCurrentPlan ? `${accent.border} ring-2 ${accent.ring}` : "border-border dark:border-darkborder"
                }`}
              >
                {ribbon && (
                  <span className={`absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-white px-3 py-1.5 rounded-full shadow-md whitespace-nowrap ${ribbon.bg}`}>
                    <Icon icon={ribbon.icon} width={13} height={13} />
                    {ribbon.label}
                  </span>
                )}

                <div className="p-6 pb-5 pt-8 border-b border-border dark:border-darkborder text-center">
                  <div className={`mx-auto mb-3 h-14 w-14 rounded-full flex items-center justify-center text-white shadow-sm ${accent.iconBg}`}>
                    <Icon icon={accent.icon} width={28} height={28} />
                  </div>
                  <h5 className={`text-lg font-bold ${accent.name}`}>{plan.name}</h5>
                  {plan.description && <p className="text-sm text-darklink mt-1">{plan.description}</p>}

                  <div className="flex items-baseline justify-center gap-1.5 mt-4 flex-wrap">
                    {originalPrice && originalPrice > Number(plan.price) && (
                      <span className="text-base text-darklink line-through">₹{originalPrice.toLocaleString()}</span>
                    )}
                    <span className={`text-3xl font-extrabold ${accent.price}`}>
                      ₹{Number(plan.price).toLocaleString()}
                    </span>
                    <span className="text-sm text-darklink">/ {cycleLabel(plan.billing_cycle)}</span>
                  </div>

                  {discountPct !== null && (
                    <span className={`inline-block text-xs font-semibold mt-2 px-2.5 py-1 rounded-full ${accent.discountBg}`}>
                      {discountPct}% OFF{originalPrice ? ` · You Save ₹${(originalPrice - Number(plan.price)).toLocaleString()}` : ""}
                    </span>
                  )}
                  {isFree && !isCurrentPlan && discountPct === null && (
                    <p className="text-xs text-success font-medium mt-1.5">Free for {cycleLabel(plan.billing_cycle)} — no payment needed</p>
                  )}
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <ul className="flex flex-col gap-3 flex-1">
                    <li className="flex items-center gap-2.5 text-sm text-charcoal dark:text-white">
                      <span className={`shrink-0 h-5 w-5 rounded-full flex items-center justify-center ${accent.check}`}>
                        <Icon icon="tabler:check" width={13} height={13} />
                      </span>
                      Unlimited seats, members & staff
                    </li>

                    {features.length > 0 && <div className="border-t border-border dark:border-darkborder my-1" />}

                    {features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-sm">
                        <span
                          className={`shrink-0 h-5 w-5 rounded-full flex items-center justify-center ${
                            feature.included ? accent.check : "bg-lighterror text-error"
                          }`}
                        >
                          <Icon icon={feature.included ? "tabler:check" : "tabler:x"} width={13} height={13} />
                        </span>
                        <span className={feature.included ? "text-charcoal dark:text-white" : "text-darklink line-through"}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center gap-1.5 text-xs text-darklink mt-4 pt-4 border-t border-border dark:border-darkborder">
                    <Icon icon="solar:calendar-linear" width={15} height={15} />
                    Validity: {validityLabel(plan.billing_cycle)}
                  </div>

                  {isFree ? (
                    <div className="mt-4">
                      <Button
                        className={`w-full flex items-center justify-center gap-1.5 text-white ${accent.button}`}
                        onClick={() => handleActivateFree(plan)}
                        disabled={busy || isLockedDowngrade || (isCurrentPlan && !canRenewNow)}
                      >
                        {isLockedDowngrade ? (
                          "Downgrade Locked"
                        ) : activatingId === plan.id ? (
                          "Activating..."
                        ) : isCurrentPlan ? (
                          <>
                            <Icon icon="tabler:refresh" width={18} height={18} />
                            Renew Free
                          </>
                        ) : (
                          <>
                            <Icon icon="solar:gift-bold" width={18} height={18} />
                            Activate Free
                          </>
                        )}
                      </Button>
                      {isLockedDowngrade && (
                        <p className="text-xs text-error text-center mt-2">
                          Downgrade not allowed while a higher plan is active.
                        </p>
                      )}
                      {isCurrentPlan && !canRenewNow && activeDaysLeft !== null && (
                        <p className="text-xs text-darklink text-center mt-2">
                          {activeDaysLeft} day{activeDaysLeft === 1 ? "" : "s"} left — renew opens up in the last {RENEW_WINDOW_DAYS} days.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4">
                      <Button
                        className={`w-full flex items-center justify-center gap-1.5 text-white ${accent.button}`}
                        onClick={() => handlePay(plan)}
                        disabled={busy || isLockedDowngrade || (isCurrentPlan && !canRenewNow)}
                      >
                        {isLockedDowngrade ? (
                          "Downgrade Locked"
                        ) : payingId === plan.id ? (
                          "Processing..."
                        ) : isCurrentPlan ? (
                          <>
                            <Icon icon="tabler:refresh" width={18} height={18} />
                            Renew
                          </>
                        ) : (
                          <>
                            <Icon icon="tabler:credit-card" width={18} height={18} />
                            Pay & Activate
                          </>
                        )}
                      </Button>
                      {isLockedDowngrade && (
                        <p className="text-xs text-error text-center mt-2">
                          Downgrade not allowed while a higher plan is active.
                        </p>
                      )}
                      {isCurrentPlan && !canRenewNow && activeDaysLeft !== null && (
                        <p className="text-xs text-darklink text-center mt-2">
                          {activeDaysLeft} day{activeDaysLeft === 1 ? "" : "s"} left — renew opens up in the last {RENEW_WINDOW_DAYS} days.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showLogout && (
        <div className="text-center mt-8">
          <Button variant="outline" onClick={handleLogout} className="flex items-center gap-1.5 mx-auto">
            <Icon icon="tabler:logout" width={18} height={18} />
            Logout
          </Button>
        </div>
      )}
    </div>
  );
}

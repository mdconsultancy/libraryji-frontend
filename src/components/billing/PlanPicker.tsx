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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          {plans.map((plan) => {
            const features = normalizePlanFeatures(plan.features);
            const isCurrentPlan = isUpgrading && user?.current_tenant?.active_subscription?.subscription_plan_id === plan.id;
            const isLockedDowngrade = !isCurrentPlan && currentPlanPrice > 0 && Number(plan.price) < currentPlanPrice;
            const busy = payingId !== null || activatingId !== null;
            const isFree = Number(plan.price) === 0;
            const originalPrice = plan.original_price ? Number(plan.original_price) : null;
            const discountPct = originalPrice && originalPrice > Number(plan.price)
              ? Math.round((1 - Number(plan.price) / originalPrice) * 100)
              : null;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl bg-white dark:bg-darkgray shadow-md hover:shadow-xl transition-shadow duration-200 overflow-hidden border ${
                  isCurrentPlan ? "border-primary ring-2 ring-primary/30" : "border-border dark:border-darkborder"
                }`}
              >
                {isCurrentPlan ? (
                  <span className="absolute top-4 right-4 text-[11px] font-semibold uppercase tracking-wide bg-lightprimary text-primary px-2.5 py-1 rounded-full">
                    Current Plan
                  </span>
                ) : isLockedDowngrade ? (
                  <span className="absolute top-4 right-4 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide bg-lighterror text-error px-2.5 py-1 rounded-full">
                    <Icon icon="solar:lock-linear" width={13} height={13} />
                    Locked
                  </span>
                ) : plan.badge_text ? (
                  <span className="absolute top-4 right-4 text-[11px] font-semibold uppercase tracking-wide bg-lightwarning text-warning px-2.5 py-1 rounded-full">
                    {plan.badge_text}
                  </span>
                ) : null}

                <div className="p-6 pb-5 border-b border-border dark:border-darkborder">
                  <h5 className="text-lg font-bold text-dark dark:text-white">{plan.name}</h5>
                  {plan.description && <p className="text-sm text-darklink mt-1">{plan.description}</p>}
                  <div className="flex items-baseline gap-1.5 mt-4 flex-wrap">
                    {originalPrice && originalPrice > Number(plan.price) && (
                      <span className="text-base text-darklink line-through">₹{originalPrice.toLocaleString()}</span>
                    )}
                    <span className="text-3xl font-extrabold text-dark dark:text-white">
                      ₹{Number(plan.price).toLocaleString()}
                    </span>
                    <span className="text-sm text-darklink">/ {cycleLabel(plan.billing_cycle)}</span>
                  </div>
                  {discountPct !== null && (
                    <p className="text-xs text-success font-semibold mt-1.5">{discountPct}% OFF</p>
                  )}
                  {isFree && !isCurrentPlan && (
                    <p className="text-xs text-success font-medium mt-1.5">Free for {cycleLabel(plan.billing_cycle)} — no payment needed</p>
                  )}
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <ul className="flex flex-col gap-3 flex-1">
                    <li className="flex items-center gap-2.5 text-sm text-charcoal dark:text-white">
                      <Icon icon="tabler:check" className="text-success shrink-0" width={18} height={18} />
                      Unlimited seats, members & staff
                    </li>

                    {features.length > 0 && <div className="border-t border-border dark:border-darkborder my-1" />}

                    {features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-sm">
                        <Icon
                          icon={feature.included ? "tabler:check" : "tabler:x"}
                          className={`shrink-0 ${feature.included ? "text-success" : "text-error"}`}
                          width={18}
                          height={18}
                        />
                        <span className={feature.included ? "text-charcoal dark:text-white" : "text-darklink line-through"}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {isFree ? (
                    <div className="mt-6">
                      <Button
                        className="w-full flex items-center justify-center gap-1.5 bg-success hover:bg-success/90"
                        onClick={() => handleActivateFree(plan)}
                        disabled={busy || (isCurrentPlan && !canRenewNow)}
                      >
                        {activatingId === plan.id ? (
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
                      {isCurrentPlan && !canRenewNow && activeDaysLeft !== null && (
                        <p className="text-xs text-darklink text-center mt-2">
                          {activeDaysLeft} day{activeDaysLeft === 1 ? "" : "s"} left — renew opens up in the last {RENEW_WINDOW_DAYS} days.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-6">
                      <Button
                        className="w-full flex items-center justify-center gap-1.5"
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

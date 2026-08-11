"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { normalizePlanFeatures } from "@/lib/planFeatures";
import type { SubscriptionPlan } from "@/types";

interface OrderResponse {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  plan: SubscriptionPlan;
}

interface PlanPickerProps {
  /** Explicit opt-in upgrade (an already-active tenant hit a limit) vs. the forced "no active plan" gate. */
  isUpgrading?: boolean;
  /** Called after a trial starts or payment verifies — caller decides what happens next (navigate, just let the gate re-check, etc). */
  onActivated?: () => void;
  /** Only the forced gate offers a logout escape hatch; the voluntary upgrade flow offers "back to dashboard" instead (handled by the page itself). */
  showLogout?: boolean;
}

export function PlanPicker({ isUpgrading = false, onActivated, showLogout = false }: PlanPickerProps) {
  const { user, refreshMe, logout } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [payingId, setPayingId] = useState<number | null>(null);
  const [trialingId, setTrialingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: plansData, isLoading: loadingPlans } = useApi<SubscriptionPlan[]>("/plans");
  const plans = plansData ?? [];

  // trial_ends_at is set the moment a trial is ever granted (even after it
  // lapses) — see PlanSelectionController::startTrial — so its presence is
  // exactly "has this tenant already had their one free month".
  const trialAvailable = !isUpgrading && !user?.current_tenant?.trial_ends_at;

  const handleStartTrial = async (plan: SubscriptionPlan) => {
    setTrialingId(plan.id);
    setError(null);
    try {
      await api.post("/admin/select-plan/trial", { subscription_plan_id: plan.id });
      await refreshMe();
      toast.success(`Your free month of ${plan.name} has started! No payment needed until it ends.`);
      onActivated?.();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Unable to start your free trial. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setTrialingId(null);
    }
  };

  const handlePay = async (plan: SubscriptionPlan) => {
    setPayingId(plan.id);
    setError(null);
    try {
      const order = await api.post<OrderResponse>("/admin/select-plan/order", {
        subscription_plan_id: plan.id,
      });

      await openRazorpayCheckout(
        {
          key: order.key_id,
          amount: order.amount,
          currency: order.currency,
          order_id: order.order_id,
          name: "LibraryJi",
          description: `${plan.name} subscription`,
          prefill: {
            name: user?.name,
            email: user?.email || undefined,
            contact: user?.phone || undefined,
          },
          theme: { color: "#5D87FF" },
          handler: async (response) => {
            try {
              const result = await api.post<{ tenant: { library_code: string | null } }>("/admin/select-plan/verify", {
                subscription_plan_id: plan.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              await refreshMe();
              const code = result.tenant?.library_code;
              toast.success(
                code
                  ? `Payment successful! Your library is now active. Your Library Code is ${code} — you'll need it to log in.`
                  : "Payment successful! Your library is now active."
              );
              onActivated?.();
            } catch (err) {
              setError(err instanceof ApiError ? err.message : "Payment verification failed.");
              toast.error("We couldn't verify your payment. Please contact support if you were charged.");
            } finally {
              setPayingId(null);
            }
          },
          modal: {
            ondismiss: () => setPayingId(null),
          },
        },
        (message) => {
          setError(message);
          toast.error(message);
          setPayingId(null);
        }
      );
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Unable to start payment. Please try again.";
      setError(message);
      toast.error(message);
      setPayingId(null);
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
            const busy = payingId !== null || trialingId !== null;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl bg-white dark:bg-darkgray shadow-md hover:shadow-xl transition-shadow duration-200 overflow-hidden border ${
                  isCurrentPlan ? "border-primary ring-2 ring-primary/30" : "border-border dark:border-darkborder"
                }`}
              >
                {isCurrentPlan && (
                  <span className="absolute top-4 right-4 text-[11px] font-semibold uppercase tracking-wide bg-lightprimary text-primary px-2.5 py-1 rounded-full">
                    Current Plan
                  </span>
                )}
                {trialAvailable && !isCurrentPlan && (
                  <span className="absolute top-4 right-4 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide bg-lightsuccess text-success px-2.5 py-1 rounded-full">
                    <Icon icon="solar:gift-bold" width={13} height={13} />
                    First Month Free
                  </span>
                )}

                <div className="p-6 pb-5 border-b border-border dark:border-darkborder">
                  <h5 className="text-lg font-bold text-dark dark:text-white">{plan.name}</h5>
                  {plan.description && <p className="text-sm text-darklink mt-1">{plan.description}</p>}
                  <div className="flex items-baseline gap-1.5 mt-4">
                    <span className="text-3xl font-extrabold text-dark dark:text-white">
                      ₹{Number(plan.price).toLocaleString()}
                    </span>
                    <span className="text-sm text-darklink">/ {plan.billing_cycle}</span>
                  </div>
                  {trialAvailable && !isCurrentPlan && (
                    <p className="text-xs text-success font-medium mt-1.5">Free for your first month, then ₹{Number(plan.price).toLocaleString()}/{plan.billing_cycle}</p>
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

                  {trialAvailable && !isCurrentPlan ? (
                    <div className="flex flex-col gap-2 mt-6">
                      <Button
                        className="w-full flex items-center justify-center gap-1.5 bg-success hover:bg-success/90"
                        onClick={() => handleStartTrial(plan)}
                        disabled={busy}
                      >
                        {trialingId === plan.id ? (
                          "Starting..."
                        ) : (
                          <>
                            <Icon icon="solar:gift-bold" width={18} height={18} />
                            Start Free Trial
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full flex items-center justify-center gap-1.5"
                        onClick={() => handlePay(plan)}
                        disabled={busy}
                      >
                        {payingId === plan.id ? "Processing..." : "Pay now instead"}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full flex items-center justify-center gap-1.5 mt-6"
                      onClick={() => handlePay(plan)}
                      disabled={busy || isCurrentPlan}
                    >
                      {isCurrentPlan ? (
                        "Your Current Plan"
                      ) : payingId === plan.id ? (
                        "Processing..."
                      ) : (
                        <>
                          <Icon icon="tabler:credit-card" width={18} height={18} />
                          Pay & Activate
                        </>
                      )}
                    </Button>
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

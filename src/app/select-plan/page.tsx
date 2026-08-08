"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FullLogo from "@/app/(DashboardLayout)/layout/shared/logo/FullLogo";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { tenantNeedsPlan } from "@/lib/tenant";
import { normalizePlanFeatures } from "@/lib/planFeatures";
import type { SubscriptionPlan } from "@/types";

interface OrderResponse {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  plan: SubscriptionPlan;
}

export default function SelectPlanPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center">Loading...</div>}>
      <SelectPlanContent />
    </Suspense>
  );
}

function SelectPlanContent() {
  const { user, loading, refreshMe, logout } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  // An active tenant that's just upgrading (hit a plan limit) explicitly opts
  // in via ?upgrade=1 — everyone else only lands here when payment-pending,
  // in which case bouncing back to "/" the moment they're active is correct.
  const isUpgrading = searchParams.get("upgrade") === "1";
  const [payingId, setPayingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: plansData, isLoading: loadingPlans } = useApi<SubscriptionPlan[]>("/plans");
  const plans = plansData ?? [];

  useEffect(() => {
    if (!loading && user && !isUpgrading && !tenantNeedsPlan(user.current_tenant)) {
      router.replace("/");
    }
  }, [loading, user, isUpgrading, router]);

  const handlePay = async (plan: SubscriptionPlan) => {
    setPayingId(plan.id);
    setError(null);
    try {
      const order = await api.post<OrderResponse>("/admin/select-plan/order", {
        subscription_plan_id: plan.id,
      });

      await openRazorpayCheckout({
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
            router.push("/");
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
      }, (message) => {
        setError(message);
        toast.error(message);
        setPayingId(null);
      });
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

  if (loading || !user) {
    return <div className="h-screen w-full flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen w-full bg-lightprimary py-10 px-4">
      <div className="flex justify-center mb-4">
        <FullLogo />
      </div>
      <div className="max-w-4xl mx-auto text-center mb-10">
        <h4 className="text-2xl font-bold text-dark mb-2">{isUpgrading ? "Upgrade your plan" : "Choose a plan to continue"}</h4>
        <p className="text-sm text-charcoal">
          {isUpgrading
            ? "Pick a higher plan to raise your limits — your new plan applies as soon as payment is confirmed."
            : user.current_tenant?.status === "suspended" || user.current_tenant?.status === "cancelled"
            ? "Complete payment below to activate your library."
            : "Your trial period has ended. Select a plan below to keep using LibraryJi."}
        </p>
        {!isUpgrading && user.current_tenant?.library_code && (
          <p className="text-xs text-charcoal mt-3">
            Your Library Code is{" "}
            <span className="font-mono font-semibold tracking-wider bg-white/60 px-2 py-0.5 rounded">
              {user.current_tenant.library_code}
            </span>{" "}
            — save it. You&apos;ll need it to sign back in if you leave before finishing payment.
          </p>
        )}
      </div>

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
            const isCurrentPlan = isUpgrading && user.current_tenant?.active_subscription?.subscription_plan_id === plan.id;

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

                <div className="p-6 pb-5 border-b border-border dark:border-darkborder">
                  <h5 className="text-lg font-bold text-dark dark:text-white">{plan.name}</h5>
                  {plan.description && <p className="text-sm text-darklink mt-1">{plan.description}</p>}
                  <div className="flex items-baseline gap-1.5 mt-4">
                    <span className="text-3xl font-extrabold text-dark dark:text-white">
                      ₹{Number(plan.price).toLocaleString()}
                    </span>
                    <span className="text-sm text-darklink">/ {plan.billing_cycle}</span>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <ul className="flex flex-col gap-3 flex-1">
                    <li className="flex items-center gap-2.5 text-sm text-charcoal dark:text-white">
                      <Icon icon="tabler:check" className="text-success shrink-0" width={18} height={18} />
                      Up to {plan.max_seats} seats
                    </li>
                    <li className="flex items-center gap-2.5 text-sm text-charcoal dark:text-white">
                      <Icon icon="tabler:check" className="text-success shrink-0" width={18} height={18} />
                      Up to {plan.max_members} members
                    </li>
                    <li className="flex items-center gap-2.5 text-sm text-charcoal dark:text-white">
                      <Icon icon="tabler:check" className="text-success shrink-0" width={18} height={18} />
                      Up to {plan.max_staff} staff accounts
                    </li>
                    <li className="flex items-center gap-2.5 text-sm text-charcoal dark:text-white">
                      <Icon icon="tabler:check" className="text-success shrink-0" width={18} height={18} />
                      {plan.max_libraries === null ? "Unlimited" : plan.max_libraries} {plan.max_libraries === 1 ? "Library" : "Libraries"}
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

                  <Button
                    className="w-full flex items-center justify-center gap-1.5 mt-6"
                    onClick={() => handlePay(plan)}
                    disabled={payingId !== null || isCurrentPlan}
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
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-center mt-8">
        {isUpgrading ? (
          <Button variant="outline" onClick={() => router.push("/")} className="flex items-center gap-1.5 mx-auto">
            <Icon icon="tabler:arrow-left" width={18} height={18} />
            Back to Dashboard
          </Button>
        ) : (
          <Button variant="outline" onClick={handleLogout} className="flex items-center gap-1.5 mx-auto">
            <Icon icon="tabler:logout" width={18} height={18} />
            Logout
          </Button>
        )}
      </div>
    </div>
  );
}

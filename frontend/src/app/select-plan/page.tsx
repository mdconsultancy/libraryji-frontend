"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FullLogo from "@/app/(DashboardLayout)/layout/shared/logo/FullLogo";
import CardBox from "@/app/components/shared/CardBox";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { tenantNeedsPlan } from "@/lib/tenant";
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
      <div className="max-w-4xl mx-auto text-center mb-8">
        <h4 className="text-xl font-semibold mb-2">{isUpgrading ? "Upgrade your plan" : "Choose a plan to continue"}</h4>
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
        <p className="text-center text-sm text-charcoal">Loading plans...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <CardBox key={plan.id} className="p-6 flex flex-col">
              <h5 className="card-title mb-2">{plan.name}</h5>
              <p className="text-2xl font-semibold mb-1">
                ₹{Number(plan.price).toLocaleString()}
                <span className="text-sm font-normal text-gray-500"> / {plan.billing_cycle}</span>
              </p>
              {plan.description && <p className="text-sm text-gray-500 mb-4">{plan.description}</p>}
              <ul className="text-sm text-charcoal space-y-1 mb-6 flex-1">
                <li>Up to {plan.max_seats} seats</li>
                <li>Up to {plan.max_members} members</li>
                <li>Up to {plan.max_staff} staff accounts</li>
              </ul>
              <Button className="w-full flex items-center justify-center gap-1.5" onClick={() => handlePay(plan)} disabled={payingId !== null}>
                {payingId === plan.id ? (
                  "Processing..."
                ) : (
                  <>
                    <Icon icon="tabler:credit-card" width={18} height={18} />
                    Pay & Activate
                  </>
                )}
              </Button>
            </CardBox>
          ))}
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

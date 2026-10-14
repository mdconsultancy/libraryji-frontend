"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api, ApiError } from "@/lib/api";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { openCashfreeCheckout } from "@/lib/cashfree";
import type { SubscriptionPlan } from "@/types";

interface OrderResponse {
  gateway: "razorpay" | "cashfree";
  order_id: string;
  amount: number;
  currency: string;
  // Razorpay only
  key_id?: string;
  // Cashfree only
  payment_session_id?: string;
  mode?: "sandbox" | "production";
  plan: SubscriptionPlan;
}

/**
 * The pay-and-activate flow (create Razorpay order -> checkout -> verify),
 * extracted out of PlanPicker so a single "Renew" button (e.g. on the
 * billing page's Current Plan card) can trigger it for one specific plan
 * without rendering the whole plan-picker grid.
 */
export function usePlanCheckout(onActivated?: () => void) {
  const { user, refreshMe } = useAuth();
  const toast = useToast();
  const [payingId, setPayingId] = useState<number | null>(null);

  const pay = async (plan: SubscriptionPlan) => {
    setPayingId(plan.id);
    try {
      const order = await api.post<OrderResponse>("/admin/select-plan/order", {
        subscription_plan_id: plan.id,
      });

      if (order.gateway === "cashfree") {
        try {
          await openCashfreeCheckout(order.payment_session_id!, order.mode ?? "production");
          // The popup result is only a hint — the server asks Cashfree whether
          // the order was really paid before activating anything.
          const result = await api.post<{ tenant: { library_code: string | null } }>("/admin/select-plan/verify", {
            subscription_plan_id: plan.id,
            cashfree_order_id: order.order_id,
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
          toast.error(
            err instanceof ApiError
              ? err.message
              : "We couldn't confirm your payment. If money was deducted, it will be activated automatically shortly or contact support."
          );
        } finally {
          setPayingId(null);
        }
        return;
      }

      await openRazorpayCheckout(
        {
          key: order.key_id!,
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
              toast.error(
                err instanceof ApiError
                  ? err.message
                  : "We couldn't verify your payment. Please contact support if you were charged."
              );
            } finally {
              setPayingId(null);
            }
          },
          modal: {
            ondismiss: () => setPayingId(null),
          },
        },
        (message) => {
          toast.error(message);
          setPayingId(null);
        }
      );
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to start payment. Please try again.");
      setPayingId(null);
    }
  };

  return { pay, payingId, isPaying: payingId !== null };
}

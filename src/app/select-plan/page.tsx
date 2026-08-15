"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FullLogo from "@/app/(DashboardLayout)/layout/shared/logo/FullLogo";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { useAuth } from "@/context/AuthContext";
import { tenantNeedsPlan } from "@/lib/tenant";
import { PlanPicker } from "@/components/billing/PlanPicker";

export default function SelectPlanPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center">Loading...</div>}>
      <SelectPlanContent />
    </Suspense>
  );
}

function SelectPlanContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  // An active tenant that's just upgrading (hit a plan limit) explicitly opts
  // in via ?upgrade=1 — everyone else only lands here when payment-pending,
  // in which case bouncing back to "/" the moment they're active is correct.
  const isUpgrading = searchParams.get("upgrade") === "1";

  useEffect(() => {
    if (!loading && user && !isUpgrading && !tenantNeedsPlan(user.current_tenant)) {
      router.replace("/");
    }
  }, [loading, user, isUpgrading, router]);

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
            : user.current_tenant?.trial_ends_at
            ? "Your trial period has ended. Select a plan below to keep using LibraryJi."
            : "Pick a plan below — free plans activate instantly, no card required."}
        </p>
        {!isUpgrading && user.current_tenant?.library_code && (
          <p className="text-xs text-charcoal mt-3">
            Your Library Code is{" "}
            <span className="font-mono font-semibold tracking-wider bg-white/60 px-2 py-0.5 rounded">
              {user.current_tenant.library_code}
            </span>{" "}
            — save it. You&apos;ll need it to sign back in.
          </p>
        )}
      </div>

      <PlanPicker isUpgrading={isUpgrading} onActivated={() => router.push("/")} showLogout={!isUpgrading} />

      {isUpgrading && (
        <div className="text-center mt-8">
          <Button variant="outline" onClick={() => router.push("/")} className="flex items-center gap-1.5 mx-auto">
            <Icon icon="tabler:arrow-left" width={18} height={18} />
            Back to Dashboard
          </Button>
        </div>
      )}
    </div>
  );
}

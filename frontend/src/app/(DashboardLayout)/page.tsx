"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import RevenueForecast from "../components/dashboard/RevenueForecast";
import NewCustomers from "../components/dashboard/NewCustomers";
import TotalIncome from "../components/dashboard/TotalIncome";
import ProductRevenue from "../components/dashboard/ProductRevenue";
import DailyActivity from "../components/dashboard/DailyActivity";
import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import DashboardSkeleton from "@/components/shared/DashboardSkeleton";
import { useAuth } from "@/context/AuthContext";
import type { DashboardSummary, RevenueChartPoint, Member, MemberSubscription } from "@/types";

const Page = () => {
  const { user } = useAuth();
  const router = useRouter();
  const isSuperAdmin = user?.role === "super_admin";

  useEffect(() => {
    if (isSuperAdmin) {
      router.replace("/platform");
    }
  }, [isSuperAdmin, router]);

  // Cached via SWR: fetched once, then reused instantly on every return visit
  // to this page for the lifetime of the session (no refetch on remount).
  // Skipped for super admins, who have no tenant and get redirected to /platform above.
  const { data: summary, isLoading: loadingSummary, error: errorSummary } = useApi<DashboardSummary>(isSuperAdmin ? null : "/admin/dashboard/summary");
  const { data: revenueChart, isLoading: loadingRevenue, error: errorRevenue } = useApi<RevenueChartPoint[]>(isSuperAdmin ? null : "/admin/dashboard/revenue-chart");
  const { data: recentMembers, isLoading: loadingMembers, error: errorMembers } = useApi<Member[]>(isSuperAdmin ? null : "/admin/dashboard/recent-members");
  const { data: expiring, isLoading: loadingExpiring, error: errorExpiring } = useApi<MemberSubscription[]>(isSuperAdmin ? null : "/admin/dashboard/expiring-memberships");

  const loading = isSuperAdmin || loadingSummary || loadingRevenue || loadingMembers || loadingExpiring;
  const error = !isSuperAdmin && (errorSummary || errorRevenue || errorMembers || errorExpiring);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <div className="text-center py-20 text-error">Unable to load dashboard data.</div>;
  }

  return (
    <>
      <div className="grid grid-cols-12 gap-30">
        <div className="lg:col-span-8 col-span-12">
          <RevenueForecast data={revenueChart ?? []} />
        </div>
        <div className="lg:col-span-4 col-span-12">
          <div className="grid grid-cols-12 h-full items-stretch">
            <div className="col-span-12 mb-30">
              <NewCustomers summary={summary ?? null} />
            </div>
            <div className="col-span-12">
              <TotalIncome summary={summary ?? null} revenueChart={revenueChart ?? []} />
            </div>
          </div>
        </div>
        <div className="lg:col-span-8 col-span-12">
          <ProductRevenue members={recentMembers ?? []} />
        </div>
        <div className="lg:col-span-4 col-span-12">
          <DailyActivity subscriptions={expiring ?? []} />
        </div>
        <div className="col-span-12 text-center">
          <p className="text-base">
            Design and Developed by{" "}
            <Link
              href="https://adminmart.com/"
              target="_blank"
              className="pl-1 text-primary underline decoration-primary"
            >
              adminmart.com{" "}
            </Link>
            • Distributed by{" "}
            <Link
              href="https://themewagon.com/"
              target="_blank"
              className="pl-1 text-primary underline decoration-primary"
            >
              ThemeWagon
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default Page;

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RevenueForecast from "../components/dashboard/RevenueForecast";
import NewCustomers from "../components/dashboard/NewCustomers";
import TotalIncome from "../components/dashboard/TotalIncome";
import ProductRevenue from "../components/dashboard/ProductRevenue";
import InquiryCard from "../components/dashboard/InquiryCard";
import AddMemberCard from "../components/dashboard/AddMemberCard";
import StaffOverview from "../components/dashboard/StaffOverview";
import RecentActivities from "../components/dashboard/RecentActivities";
import MobileGreeting from "../components/dashboard/mobile/MobileGreeting";
import MobileStatsGrid from "../components/dashboard/mobile/MobileStatsGrid";
import MobileAttendanceCard from "../components/dashboard/mobile/MobileAttendanceCard";
import MobileRecentActivity from "../components/dashboard/mobile/MobileRecentActivity";
import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import DashboardSkeleton from "@/components/shared/DashboardSkeleton";
import PolicyLinks from "@/app/components/shared/PolicyLinks";
import { useAuth } from "@/context/AuthContext";
import type { DashboardSummary, RevenueChartPoint, RecentActivityItem, Member } from "@/types";

const Page = () => {
  const { user } = useAuth();
  const router = useRouter();
  const isSuperAdmin = user?.role === "super_admin";
  const [revenueMonths, setRevenueMonths] = useState(6);

  useEffect(() => {
    if (isSuperAdmin) {
      router.replace("/platform");
    }
  }, [isSuperAdmin, router]);

  // Cached via SWR: fetched once, then reused instantly on every return visit
  // to this page for the lifetime of the session (no refetch on remount).
  // Skipped for super admins, who have no tenant and get redirected to /platform above.
  const { data: summary, isLoading: loadingSummary, error: errorSummary } = useApi<DashboardSummary>(isSuperAdmin ? null : "/admin/dashboard/summary");
  const { data: revenueChart, isLoading: loadingRevenue, error: errorRevenue } = useApi<RevenueChartPoint[]>(isSuperAdmin ? null : "/admin/dashboard/revenue-chart", { months: revenueMonths });
  const { data: recentMembers, isLoading: loadingMembers, error: errorMembers } = useApi<Member[]>(isSuperAdmin ? null : "/admin/dashboard/recent-members");
  const { data: activity, isLoading: loadingActivity, error: errorActivity } = useApi<RecentActivityItem[]>(isSuperAdmin ? null : "/admin/dashboard/recent-activity");

  const loading = isSuperAdmin || loadingSummary || loadingRevenue || loadingMembers || loadingActivity;
  const error = !isSuperAdmin && (errorSummary || errorRevenue || errorMembers || errorActivity);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <div className="text-center py-20 text-error">Unable to load dashboard data.</div>;
  }

  return (
    <>
      {/* Desktop (xl and up) — unchanged */}
      <div className="hidden xl:grid grid-cols-12 gap-30">
        <div className="col-span-12">
          {summary && <MobileStatsGrid summary={summary} gridClassName="grid-cols-4" />}
        </div>
        <div className="lg:col-span-8 col-span-12">
          <RevenueForecast data={revenueChart ?? []} months={revenueMonths} onMonthsChange={setRevenueMonths} />
        </div>
        <div className="lg:col-span-4 col-span-12">
          <NewCustomers summary={summary ?? null} />
        </div>

        {/* Quick-action row below the chart: Inquiries, Revenue, Staff & Halls, Add Member */}
        <div className="col-span-12">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-30 items-stretch">
            <InquiryCard summary={summary ?? null} />
            <TotalIncome summary={summary ?? null} revenueChart={revenueChart ?? []} />
            <StaffOverview summary={summary ?? null} />
            <AddMemberCard />
          </div>
        </div>

        <div className="col-span-12">
          <ProductRevenue members={recentMembers ?? []} />
        </div>
        <div className="col-span-12">
          <RecentActivities activity={activity ?? []} />
        </div>
        <div className="col-span-12 text-center">
          <p className="text-base">
            Design and Developed by{" "}
            <Link
              href="https://hinguland.com/"
              target="_blank"
              className="pl-1 text-primary underline decoration-primary"
            >
              Hinguland Digital Marketing
            </Link>
          </p>
          <PolicyLinks />
        </div>
      </div>

      {/* Mobile (below xl) — separate layout, same underlying data */}
      <div className="xl:hidden flex flex-col gap-4">
        {summary && <MobileStatsGrid summary={summary} />}
        <AddMemberCard />
        <InquiryCard summary={summary ?? null} />
        <MobileRecentActivity activity={activity ?? []} loading={loadingActivity} />
        <div className="text-center py-2">
          <p className="text-sm">
            Design and Developed by{" "}
            <Link
              href="https://hinguland.com/"
              target="_blank"
              className="pl-1 text-primary underline decoration-primary"
            >
              Hinguland Digital Marketing
            </Link>
          </p>
          <PolicyLinks />
        </div>
      </div>
    </>
  );
};

export default Page;

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import RevenueForecast from "../../components/dashboard/RevenueForecast";
import NewCustomers from "../../components/dashboard/NewCustomers";
import TotalIncome from "../../components/dashboard/TotalIncome";
import ProductRevenue from "../../components/dashboard/ProductRevenue";
import InquiryCard from "../../components/dashboard/InquiryCard";
import AddMemberCard from "../../components/dashboard/AddMemberCard";
import StaffOverview from "../../components/dashboard/StaffOverview";
import RecentActivities from "../../components/dashboard/RecentActivities";
import MobileGreeting from "../../components/dashboard/mobile/MobileGreeting";
import MobileStatsGrid from "../../components/dashboard/mobile/MobileStatsGrid";
import MobileAttendanceCard from "../../components/dashboard/mobile/MobileAttendanceCard";
import MobileRecentActivity from "../../components/dashboard/mobile/MobileRecentActivity";
import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import DashboardSkeleton from "@/components/shared/DashboardSkeleton";
import PolicyLinks from "@/app/components/shared/PolicyLinks";
import { useAuth } from "@/context/AuthContext";
import { LIVE_REFRESH_INTERVAL_MS } from "@/lib/swr";
import type { DashboardSummary, RevenueChartPoint, RevenueDaily, RecentActivityItem, Member, RecentFeedPage } from "@/types";

const FEED_PAGE_SIZE = 10;
const ACTIVITY_PAGE_SIZE = 5;

const Page = () => {
  const { user } = useAuth();
  const router = useRouter();
  const isSuperAdmin = user?.role === "super_admin";
  const [revenueMonths, setRevenueMonths] = useState<number | "daily">(6);

  useEffect(() => {
    if (isSuperAdmin) {
      router.replace("/platform");
    }
  }, [isSuperAdmin, router]);

  // Cached via SWR: fetched once, then reused instantly on every return visit
  // to this page for the lifetime of the session (no refetch on remount).
  // Skipped for super admins, who have no tenant and get redirected to /platform above.
  const { data: summary, isLoading: loadingSummary, error: errorSummary } = useApi<DashboardSummary>(
    isSuperAdmin ? null : "/admin/dashboard/summary",
    undefined,
    { refreshInterval: LIVE_REFRESH_INTERVAL_MS }
  );
  const { data: revenueChart, isLoading: loadingRevenue, error: errorRevenue } = useApi<RevenueChartPoint[]>(
    isSuperAdmin || revenueMonths === "daily" ? null : "/admin/dashboard/revenue-chart",
    { months: revenueMonths === "daily" ? undefined : revenueMonths }
  );
  const { data: revenueDaily, isLoading: loadingRevenueDaily, error: errorRevenueDaily } = useApi<RevenueDaily>(
    isSuperAdmin || revenueMonths !== "daily" ? null : "/admin/dashboard/revenue-daily"
  );
  const revenueChartData: RevenueChartPoint[] =
    revenueMonths === "daily"
      ? (revenueDaily?.days ?? []).map((d) => ({ month: String(d.day), revenue: d.revenue, expenses: d.expenses }))
      : revenueChart ?? [];

  // Recent Members and Recent Activities both use "Load more" pagination:
  // each page bump fetches a new SWR key (page N). Results are kept in a
  // page-keyed map (not a flat append list) so that a background
  // revalidation of an already-loaded page — SWR's revalidateOnFocus /
  // revalidateOnReconnect fire for the active key — overwrites that page in
  // place instead of appending its rows a second time, which is what made
  // the feed fill with duplicates and never stop "Loading…".
  const [membersPage, setMembersPage] = useState(1);
  const [membersPages, setMembersPages] = useState<Record<number, Member[]>>({});
  const {
    data: recentMembersPage,
    isLoading: loadingMembers,
    isValidating: loadingMoreMembers,
    error: errorMembers,
  } = useApi<RecentFeedPage<Member>>(isSuperAdmin ? null : "/admin/dashboard/recent-members", { page: membersPage, per_page: FEED_PAGE_SIZE });

  useEffect(() => {
    if (!recentMembersPage) return;
    setMembersPages((prev) => ({ ...prev, [recentMembersPage.page]: recentMembersPage.data }));
  }, [recentMembersPage]);

  const membersAccum = useMemo(
    () =>
      Object.keys(membersPages)
        .map(Number)
        .sort((a, b) => a - b)
        .flatMap((p) => membersPages[p]),
    [membersPages]
  );

  // Recent Activities uses numbered pages (Prev / 1 2 3 / Next) instead of
  // "Load more" — only the current page is shown, so there is nothing to
  // accumulate. keepPreviousData (global SWR config) keeps the old page on
  // screen while the next one loads.
  const [activityPage, setActivityPage] = useState(1);
  const {
    data: activityPageData,
    isLoading: loadingActivity,
    isValidating: loadingMoreActivity,
    error: errorActivity,
  } = useApi<RecentFeedPage<RecentActivityItem>>(isSuperAdmin ? null : "/admin/dashboard/recent-activity", { page: activityPage, per_page: ACTIVITY_PAGE_SIZE });

  const activityLastPage = activityPageData?.last_page ?? (activityPageData?.has_more ? activityPage + 1 : activityPage);

  // If the feed shrank (e.g. data cleaned) and the current page no longer exists, step back.
  useEffect(() => {
    if (activityPageData && activityPage > activityLastPage) setActivityPage(activityLastPage);
  }, [activityPageData, activityPage, activityLastPage]);

  const activityPagination = {
    page: activityPage,
    lastPage: activityLastPage,
    total: activityPageData?.total,
    perPage: ACTIVITY_PAGE_SIZE,
    loading: loadingMoreActivity,
    onPageChange: setActivityPage,
  };

  const loading = isSuperAdmin || loadingSummary || (revenueMonths === "daily" ? loadingRevenueDaily : loadingRevenue) || (membersPage === 1 && loadingMembers) || (activityPage === 1 && loadingActivity && !activityPageData);
  const error = !isSuperAdmin && (errorSummary || errorRevenue || errorRevenueDaily || errorMembers || errorActivity);

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
          <RevenueForecast data={revenueChartData} months={revenueMonths} onMonthsChange={setRevenueMonths} />
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
          <ProductRevenue
            members={membersAccum}
            hasMore={recentMembersPage?.has_more}
            loadingMore={loadingMoreMembers}
            onLoadMore={() => setMembersPage((p) => p + 1)}
          />
        </div>
        <div className="col-span-12">
          <RecentActivities activity={activityPageData?.data ?? []} pagination={activityPagination} />
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
        <MobileRecentActivity
          activity={activityPageData?.data ?? []}
          loading={activityPage === 1 && loadingActivity}
          pagination={activityPagination}
        />
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

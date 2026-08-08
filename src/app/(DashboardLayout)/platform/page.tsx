"use client";

import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import BreadcrumbComp from "@/app/(DashboardLayout)/layout/shared/breadcrumb/BreadcrumbComp";
import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import { useApi } from "@/hooks/useApi";
import { Skeleton } from "@/components/ui/skeleton";
import type { PlatformSummary, TenantGrowthPoint, RevenueChartPoint } from "@/types";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const BCrumb = [{ to: "/", title: "Home" }, { title: "Platform Dashboard" }];

const statCards = [
  { key: "total_tenants", label: "Total Tenants", icon: "solar:buildings-3-line-duotone", color: "primary" },
  { key: "active_tenants", label: "Active Tenants", icon: "solar:check-circle-line-duotone", color: "success" },
  { key: "trial_tenants", label: "Trial Tenants", icon: "solar:clock-circle-line-duotone", color: "warning" },
  { key: "suspended_tenants", label: "Suspended Tenants", icon: "solar:close-circle-line-duotone", color: "error" },
] as const;

export default function PlatformDashboardPage() {
  // Cached via SWR — fetched once, reused instantly across the rest of the session.
  const { data: summary, isLoading: loadingSummary } = useApi<PlatformSummary>("/super-admin/dashboard/summary");
  const { data: growthData, isLoading: loadingGrowth } = useApi<TenantGrowthPoint[]>("/super-admin/dashboard/tenant-growth-chart");
  const { data: revenueData, isLoading: loadingRevenue } = useApi<RevenueChartPoint[]>("/super-admin/dashboard/revenue-chart");

  const growth = growthData ?? [];
  const revenue = revenueData ?? [];
  const loading = loadingSummary || loadingGrowth || loadingRevenue;

  const growthOptions: ApexOptions = {
    chart: { toolbar: { show: false } },
    colors: ["var(--color-primary)"],
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 3 },
    xaxis: { categories: growth.map((g) => g.month) },
    grid: { borderColor: "#90A4AE50" },
  };

  const revenueOptions: ApexOptions = {
    chart: { toolbar: { show: false } },
    colors: ["var(--color-secondary)"],
    dataLabels: { enabled: false },
    plotOptions: { bar: { borderRadius: 5, columnWidth: "40%" } },
    xaxis: { categories: revenue.map((r) => r.month) },
    grid: { borderColor: "#90A4AE50" },
  };

  return (
    <>
      <BreadcrumbComp title="Platform Dashboard" items={BCrumb} />

      {loading ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardBox key={i} className="p-6 bg-background border-none rounded-xl shadow-xs">
                <Skeleton className="h-10 w-10 rounded-md mb-4" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-6 w-12" />
              </CardBox>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <CardBox key={i} className="p-6 bg-background border-none rounded-xl shadow-xs">
                <Skeleton className="h-5 w-40 mb-6" />
                <Skeleton className="h-[280px] w-full rounded-lg" />
              </CardBox>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <CardBox key={i} className="p-6 bg-background border-none rounded-xl shadow-xs">
                <Skeleton className="h-4 w-32 mb-3" />
                <Skeleton className="h-6 w-20" />
              </CardBox>
            ))}
          </div>
        </div>
      ) : (
        <>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {statCards.map((card) => (
          <CardBox key={card.key} className="p-6 bg-background border-none rounded-xl shadow-xs">
            <div className={`bg-light${card.color} text-${card.color} p-3 rounded-md w-fit mb-4`}>
              <Icon icon={card.icon} height={24} />
            </div>
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-2xl font-semibold mt-1">{summary?.[card.key] ?? 0}</p>
          </CardBox>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <CardBox className="p-6 bg-background border-none rounded-xl shadow-xs">
          <h5 className="card-title mb-6">Tenant Growth (Last 6 Months)</h5>
          <Chart options={growthOptions} series={[{ name: "New Tenants", data: growth.map((g) => g.new_tenants) }]} type="line" height={280} />
        </CardBox>
        <CardBox className="p-6 bg-background border-none rounded-xl shadow-xs">
          <h5 className="card-title mb-6">Revenue (Last 6 Months)</h5>
          <Chart options={revenueOptions} series={[{ name: "Revenue", data: revenue.map((r) => r.revenue) }]} type="bar" height={280} />
        </CardBox>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <CardBox className="p-6 bg-background border-none rounded-xl shadow-xs">
          <p className="text-sm text-gray-500">Monthly Recurring Revenue</p>
          <p className="text-2xl font-semibold mt-1">₹{(summary?.monthly_recurring_revenue ?? 0).toLocaleString()}</p>
        </CardBox>
        <CardBox className="p-6 bg-background border-none rounded-xl shadow-xs">
          <p className="text-sm text-gray-500">Members Platform-wide</p>
          <p className="text-2xl font-semibold mt-1">{summary?.total_members_platform_wide ?? 0}</p>
        </CardBox>
      </div>
        </>
      )}
    </>
  );
}

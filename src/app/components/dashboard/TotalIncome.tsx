"use client";
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import Link from "next/link";
import { Icon } from "@iconify/react";
import { Badge } from "@/components/ui/badge";
import type { DashboardSummary, RevenueChartPoint } from "@/types";

const TotalIncome = ({
  summary,
  revenueChart,
}: {
  summary: DashboardSummary | null
  revenueChart: RevenueChartPoint[]
}) => {
  const revenueThisMonth = summary?.revenue_this_month ?? 0;
  const revenueLastMonth = summary?.revenue_last_month ?? 0;
  const changePct = revenueLastMonth > 0
    ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
    : revenueThisMonth > 0 ? 100 : 0;

  const ChartData: any = {
    series: [
      {
        name: "monthly revenue",
        color: "#FB7185",
        data: revenueChart.map((d) => d.revenue),
      },
    ],
    chart: {
      id: "total-income",
      type: "area",
      height: 60,
      sparkline: {
        enabled: true,
      },
      group: "sparklines",
      fontFamily: "inherit",
      foreColor: "#adb0bb",
    },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 0,
        inverseColors: false,
        opacityFrom: 0,
        opacityTo: 0,
        stops: [20, 180],
      },
    },
    markers: {
      size: 0,
    },
    tooltip: {
      theme: "dark",
      fixed: {
        enabled: true,
        position: "right",
      },
      x: {
        show: false,
      },
    },
  };

  return (
    <Link
      href="/payments"
      className="block bg-[#FB7185]/20 border border-[#FB7185]/20 dark:bg-[#FB7185]/15 dark:border-[#FB7185]/20 rounded-xl shadow-xs p-8 hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-[#FB7185] text-white p-3 rounded-md">
          <Icon icon="tabler:box" height={24} />
        </div>
        <p className="text-lg font-semibold text-dark dark:text-white">Revenue This Month</p>
      </div>

      {/* Body */}
      <div className="flex">
        <div className="flex-1">
          <p className="text-xl text-dark dark:text-white mb-2">
            ₹{revenueThisMonth.toLocaleString()}
          </p>

          <Badge
            className={`${changePct >= 0 ? 'bg-lightsuccess text-success hover:bg-lightsuccess/80' : 'bg-lighterror text-error hover:bg-lighterror/80'} text-xs px-2 py-1`}
          >
            {changePct >= 0 ? '+' : ''}{changePct}%
          </Badge>
        </div>

        {/* Chart */}
        <div className="rounded-bars flex-1 md:ps-7">
          <Chart
            options={ChartData}
            series={ChartData.series}
            type="area"
            height="60px"
            width="100%"
          />
        </div>
      </div>
    </Link>
  );
};

export default TotalIncome;

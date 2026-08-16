"use client";
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import Link from "next/link";
import { Icon } from "@iconify/react";
import type { DashboardSummary } from "@/types";

const NewCustomers = ({ summary }: { summary: DashboardSummary | null }) => {
  const rate = summary?.occupancy_rate ?? 0;

  const chartOptions: any = {
    chart: { type: "radialBar", sparkline: { enabled: true } },
    colors: ["#0F766E"],
    plotOptions: {
      radialBar: {
        hollow: { size: "68%" },
        track: { background: "#0F766E33" },
        dataLabels: {
          name: { show: false },
          value: {
            fontSize: "26px",
            fontWeight: 700,
            color: "#0F766E",
            offsetY: 8,
            formatter: (val: number) => `${val}%`,
          },
        },
      },
    },
    stroke: { lineCap: "round" },
  };

  return (
    <Link
      href="/seats"
      className="block h-full bg-[#0F766E]/20 border border-[#0F766E]/20 dark:bg-[#0F766E]/15 dark:border-[#0F766E]/20 rounded-xl shadow-xs p-8 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-center gap-4 mb-2">
        <div className="bg-[#0F766E] text-white p-3 rounded-md">
          <Icon icon="tabler:armchair" height={24} />
        </div>
        <p className="text-lg font-semibold text-dark dark:text-white">Seat Occupancy</p>
      </div>

      <div className="flex justify-center">
        <Chart options={chartOptions} series={[rate]} type="radialBar" height={200} width="100%" />
      </div>

      <p className="text-sm text-darklink text-center -mt-2">
        {summary ? `${summary.occupied_seats} / ${summary.total_seats} seats occupied` : 'Occupied seats'}
      </p>
    </Link>
  );
};

export default NewCustomers;

"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import type { DashboardSummary } from "@/types";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

/** Present vs. absent donut for today, built from the same DashboardSummary used elsewhere — no "late" bucket, since attendance here is only ever checked-in/not. */
const MobileAttendanceCard = ({ summary }: { summary: DashboardSummary }) => {
  const present = summary.present_today;
  const absent = summary.absent_today;
  const total = present + absent;
  const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

  const options: ApexOptions = {
    chart: { toolbar: { show: false } },
    labels: ["Present", "Absent"],
    colors: ["var(--color-primary)", "var(--color-success)"],
    dataLabels: { enabled: false },
    legend: { show: false },
    stroke: { width: 0 },
    plotOptions: {
      pie: {
        donut: {
          size: "75%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Attendance",
              formatter: () => `${attendanceRate}%`,
            },
          },
        },
      },
    },
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-darkgray p-5 shadow-xs">
      <h5 className="card-title mb-4">Today&apos;s Attendance</h5>
      <div className="flex items-center gap-4">
        <div className="w-32 shrink-0">
          {total > 0 ? (
            <Chart options={options} series={[present, absent]} type="donut" height={128} />
          ) : (
            <div className="h-32 w-32 rounded-full border-8 border-border dark:border-darkborder flex items-center justify-center">
              <span className="text-xs text-darklink">No data</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span className="text-sm text-link dark:text-darklink">Present</span>
            <span className="text-sm font-semibold text-dark dark:text-white">{present}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-success" />
            <span className="text-sm text-link dark:text-darklink">Absent</span>
            <span className="text-sm font-semibold text-dark dark:text-white">{absent}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileAttendanceCard;

"use client";

import { Icon } from "@iconify/react";
import type { DashboardSummary } from "@/types";

const currency = (value: number) =>
  `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const stats = (summary: DashboardSummary) => [
  { label: "Total Students", value: summary.total_members, icon: "solar:users-group-rounded-bold-duotone", color: "primary" as const },
  { label: "Present Today", value: summary.present_today, icon: "solar:user-check-rounded-bold-duotone", color: "success" as const },
  { label: "Absent Today", value: summary.absent_today, icon: "solar:user-cross-rounded-bold-duotone", color: "error" as const },
  { label: "Occupied Seats", value: summary.occupied_seats, icon: "solar:armchair-2-bold-duotone", color: "secondary" as const, sub: `${summary.occupancy_rate}%` },
  { label: "Available Seats", value: summary.available_seats, icon: "solar:armchair-bold-duotone", color: "info" as const },
  { label: "Revenue This Month", value: currency(summary.revenue_this_month), icon: "solar:wallet-money-bold-duotone", color: "warning" as const },
];

const colorClasses = {
  primary: "bg-lightprimary text-primary",
  success: "bg-lightsuccess text-success",
  error: "bg-lighterror text-error",
  secondary: "bg-lightsecondary text-secondary",
  info: "bg-lightinfo text-info",
  warning: "bg-lightwarning text-warning",
};

/** 2-up stat card grid for the mobile dashboard, sourced from the same DashboardSummary already fetched for desktop. */
const MobileStatsGrid = ({ summary }: { summary: DashboardSummary }) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      {stats(summary).map((stat) => (
        <div key={stat.label} className="rounded-2xl bg-white dark:bg-darkgray p-4 shadow-xs">
          <div className={`h-9 w-9 rounded-full flex items-center justify-center ${colorClasses[stat.color]}`}>
            <Icon icon={stat.icon} width={20} height={20} />
          </div>
          <p className="text-xs text-link dark:text-darklink mt-3">{stat.label}</p>
          <div className="flex items-baseline gap-1.5">
            <p className="text-lg font-bold text-dark dark:text-white">{stat.value}</p>
            {stat.sub && <span className="text-xs text-darklink">{stat.sub}</span>}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MobileStatsGrid;

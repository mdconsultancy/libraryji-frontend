"use client";

import { Icon } from "@iconify/react";
import type { DashboardSummary } from "@/types";

const currency = (value: number) =>
  `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const stats = (summary: DashboardSummary) => [
  { label: "Total Students", value: summary.total_members, icon: "solar:users-group-rounded-bold-duotone", color: "primary" as const },
  { label: "Total Fee Paid", value: summary.fee_paid_students, icon: "solar:check-circle-bold-duotone", color: "success" as const },
  { label: "Partial Fee", value: summary.partial_fee_students, icon: "solar:hourglass-line-bold-duotone", color: "warning" as const },
  { label: "Fee Pending", value: summary.fee_pending_students, icon: "solar:danger-circle-bold-duotone", color: "error" as const },
  { label: "Available Seats", value: summary.available_seats, icon: "solar:armchair-bold-duotone", color: "info" as const },
  { label: "Rotation Seats", value: summary.rotation_seats, icon: "solar:refresh-circle-bold-duotone", color: "secondary" as const },
  { label: "Total Seats", value: summary.total_seats, icon: "solar:armchair-2-bold-duotone", color: "primary" as const },
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

/** 8-card stat grid sourced from DashboardSummary — 2-up on mobile, 4-up on desktop via `gridClassName`. */
const MobileStatsGrid = ({ summary, gridClassName = "grid-cols-2" }: { summary: DashboardSummary; gridClassName?: string }) => {
  return (
    <div className={`grid gap-3 ${gridClassName}`}>
      {stats(summary).map((stat) => (
        <div key={stat.label} className="rounded-2xl bg-white dark:bg-darkgray p-4 shadow-xs">
          <div className={`h-9 w-9 rounded-full flex items-center justify-center ${colorClasses[stat.color]}`}>
            <Icon icon={stat.icon} width={20} height={20} />
          </div>
          <p className="text-xs text-link dark:text-darklink mt-3">{stat.label}</p>
          <div className="flex items-baseline gap-1.5">
            <p className="text-lg font-bold text-dark dark:text-white">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MobileStatsGrid;

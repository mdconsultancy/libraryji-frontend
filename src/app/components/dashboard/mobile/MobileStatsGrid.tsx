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

// Each card gets its own tinted background + accent border so the grid
// reads as distinct at-a-glance categories rather than eight identical
// white tiles — pastel enough to stay professional/eye-friendly.
const cardClasses = {
  primary: "bg-lightprimary/50 dark:bg-primary/10 border-primary/30",
  success: "bg-lightsuccess/50 dark:bg-success/10 border-success/30",
  error: "bg-lighterror/50 dark:bg-error/10 border-error/30",
  secondary: "bg-lightsecondary/50 dark:bg-secondary/10 border-secondary/30",
  info: "bg-lightinfo/50 dark:bg-info/10 border-info/30",
  warning: "bg-lightwarning/50 dark:bg-warning/10 border-warning/30",
};

/** 8-card stat grid sourced from DashboardSummary — 2-up on mobile, 4-up on desktop via `gridClassName`. */
const MobileStatsGrid = ({ summary, gridClassName = "grid-cols-2" }: { summary: DashboardSummary; gridClassName?: string }) => {
  return (
    <div className={`grid gap-3 ${gridClassName}`}>
      {stats(summary).map((stat) => (
        <div key={stat.label} className={`rounded-2xl border p-4 shadow-xs ${cardClasses[stat.color]}`}>
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

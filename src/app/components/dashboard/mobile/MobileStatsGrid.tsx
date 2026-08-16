"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import type { DashboardSummary } from "@/types";

const currency = (value: number) =>
  `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const stats = (summary: DashboardSummary) => [
  { label: "Total Students", value: summary.total_members, icon: "solar:users-group-rounded-bold-duotone", color: "primary" as const, href: "/members" },
  { label: "Total Fee Paid", value: summary.fee_paid_students, icon: "solar:check-circle-bold-duotone", color: "success" as const, href: "/members" },
  { label: "Partial Fee", value: summary.partial_fee_students, icon: "solar:hourglass-line-bold-duotone", color: "orange" as const, href: "/members" },
  { label: "Fee Pending", value: summary.fee_pending_students, icon: "solar:danger-circle-bold-duotone", color: "error" as const, href: "/members" },
  { label: "Available Seats", value: summary.available_seats, icon: "solar:armchair-bold-duotone", color: "info" as const, href: "/seats" },
  { label: "Rotation Seats", value: summary.rotation_seats, icon: "solar:refresh-circle-bold-duotone", color: "secondary" as const, href: "/seats" },
  { label: "Total Seats", value: summary.total_seats, icon: "solar:armchair-2-bold-duotone", color: "indigo" as const, href: "/seats" },
  { label: "Revenue This Month", value: currency(summary.revenue_this_month), icon: "solar:wallet-money-bold-duotone", color: "peach" as const, href: "/payments" },
];

// Every tone below is picked so no two are "just a lighter/darker version of
// the same hue" at a glance — green/teal/blue and purple/indigo in
// particular are pushed to clearly separated hues + value, not just
// adjacent Tailwind shades of the same family.
const colorClasses = {
  primary: "bg-[#7C3AED] text-white", // purple
  success: "bg-[#16A34A] text-white", // green
  error: "bg-[#DC2626] text-white", // red
  secondary: "bg-[#0F766E] text-white", // deep teal
  info: "bg-[#2563EB] text-white", // blue
  indigo: "bg-[#3730A3] text-white", // deep navy-indigo
  orange: "bg-[#EA580C] text-white", // orange
  peach: "bg-[#FB7185] text-white", // light coral-pink
};

// ~20% tinted card background per category — every card gets its own
// clearly distinct color, same in light and dark mode.
const cardClasses = {
  primary: "bg-[#7C3AED]/20 border-[#7C3AED]/20 dark:bg-[#7C3AED]/15 dark:border-[#7C3AED]/20",
  success: "bg-[#16A34A]/20 border-[#16A34A]/20 dark:bg-[#16A34A]/15 dark:border-[#16A34A]/20",
  error: "bg-[#DC2626]/20 border-[#DC2626]/20 dark:bg-[#DC2626]/15 dark:border-[#DC2626]/20",
  secondary: "bg-[#0F766E]/20 border-[#0F766E]/20 dark:bg-[#0F766E]/15 dark:border-[#0F766E]/20",
  info: "bg-[#2563EB]/20 border-[#2563EB]/20 dark:bg-[#2563EB]/15 dark:border-[#2563EB]/20",
  indigo: "bg-[#3730A3]/20 border-[#3730A3]/20 dark:bg-[#3730A3]/15 dark:border-[#3730A3]/20",
  orange: "bg-[#EA580C]/20 border-[#EA580C]/20 dark:bg-[#EA580C]/15 dark:border-[#EA580C]/20",
  peach: "bg-[#FB7185]/20 border-[#FB7185]/20 dark:bg-[#FB7185]/15 dark:border-[#FB7185]/20",
};

/** 8-card stat grid sourced from DashboardSummary — 2-up on mobile, 4-up on desktop via `gridClassName`. */
const MobileStatsGrid = ({ summary, gridClassName = "grid-cols-2" }: { summary: DashboardSummary; gridClassName?: string }) => {
  return (
    <div className={`grid gap-3 ${gridClassName}`}>
      {stats(summary).map((stat) => (
        <Link
          key={stat.label}
          href={stat.href}
          className={`block rounded-2xl border p-4 shadow-xs hover:shadow-md transition-shadow cursor-pointer ${cardClasses[stat.color]}`}
        >
          <div className={`h-9 w-9 rounded-full flex items-center justify-center ${colorClasses[stat.color]}`}>
            <Icon icon={stat.icon} width={20} height={20} />
          </div>
          <p className="text-xs mt-3 text-darklink">{stat.label}</p>
          <div className="flex items-baseline gap-1.5">
            <p className="text-lg font-bold text-dark dark:text-white">{stat.value}</p>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default MobileStatsGrid;

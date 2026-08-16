"use client";
import Link from "next/link";
import { Icon } from "@iconify/react";
import type { DashboardSummary } from "@/types";

const StaffOverview = ({ summary }: { summary: DashboardSummary | null }) => {
  return (
    <Link
      href="/staff"
      className="block bg-[#2563EB]/20 border border-[#2563EB]/20 dark:bg-[#2563EB]/15 dark:border-[#2563EB]/20 rounded-xl shadow-xs p-8 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-[#2563EB] text-white p-3 rounded-md">
          <Icon icon="solar:shield-user-outline" height={24} />
        </div>
        <p className="text-lg font-semibold text-dark dark:text-white">Staff & Halls</p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-semibold text-dark dark:text-white">{summary?.staff_count ?? 0}</p>
          <p className="text-sm text-darklink mt-1">Staff members</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-dark dark:text-white">{summary?.halls_count ?? 0}</p>
          <p className="text-sm text-darklink mt-1">Halls</p>
        </div>
      </div>

      <span className="text-sm text-[#2563EB] dark:text-[#60A5FA] underline underline-offset-2 mt-6 inline-block">
        Manage staff
      </span>
    </Link>
  );
};

export default StaffOverview;

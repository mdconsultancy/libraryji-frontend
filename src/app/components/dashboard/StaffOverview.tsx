"use client";
import Link from "next/link";
import { Icon } from "@iconify/react";
import type { DashboardSummary } from "@/types";

const StaffOverview = ({ summary }: { summary: DashboardSummary | null }) => {
  return (
    <div className="bg-lightinfo/40 dark:bg-info/10 border border-info/30 rounded-xl shadow-xs p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-lightprimary text-primary p-3 rounded-md">
          <Icon icon="solar:shield-user-outline" height={24} />
        </div>
        <p className="text-lg card-title">Staff & Halls</p>
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

      <Link href="/staff" className="text-sm text-primary mt-6 inline-block">
        Manage staff
      </Link>
    </div>
  );
};

export default StaffOverview;

"use client";
import { Icon } from "@iconify/react";
import { Progress } from "@/components/ui/progress";
import type { DashboardSummary } from "@/types";

const NewCustomers = ({ summary }: { summary: DashboardSummary | null }) => {
  const rate = summary?.occupancy_rate ?? 0;

  return (
    <div className="bg-lightsecondary/40 dark:bg-secondary/10 border border-secondary/30 rounded-xl shadow-xs p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-lightsecondary text-secondary p-3 rounded-md">
          <Icon icon="tabler:armchair" height={24} />
        </div>
        <p className="text-lg card-title">Seat Occupancy</p>
      </div>

      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-ld">
          {summary ? `${summary.occupied_seats} / ${summary.total_seats} seats occupied` : 'Occupied seats'}
        </p>
        <p className="text-sm text-ld">{rate}%</p>
      </div>

      <Progress
        value={rate}
        className="h-2 bg-lightsecondary [&>div]:bg-secondary"
      />
    </div>
  );
};

export default NewCustomers;

"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";

interface PlanLimitBannerProps {
  /** Human label, e.g. "Seats", "Staff Members". */
  resource: string;
  limit: number;
  used: number;
}

export default function PlanLimitBanner({ resource, limit, used }: PlanLimitBannerProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-lightwarning px-4 py-3 mb-4">
      <div className="flex items-center gap-2 text-sm text-warning">
        <Icon icon="tabler:alert-triangle" width={18} height={18} />
        <span>
          Limit reached — {used}/{limit} {resource}. Upgrade your plan to add more.
        </span>
      </div>
      <Link href="/select-plan?upgrade=1">
        <Button size="sm" variant="outline" className="flex items-center gap-1.5">
          <Icon icon="tabler:arrow-big-up-line" width={16} height={16} />
          Upgrade Plan
        </Button>
      </Link>
    </div>
  );
}

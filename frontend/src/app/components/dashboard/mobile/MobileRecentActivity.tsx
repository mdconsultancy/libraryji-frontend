"use client";

import { Icon } from "@iconify/react";
import type { RecentActivityItem, RecentActivityType } from "@/types";

const iconByType: Record<RecentActivityType, { icon: string; color: "success" | "primary" | "info" }> = {
  member_joined: { icon: "solar:user-plus-bold-duotone", color: "success" },
  payment_received: { icon: "solar:wallet-money-bold-duotone", color: "primary" },
  attendance_check_in: { icon: "solar:login-3-bold-duotone", color: "info" },
};

const colorClasses = {
  success: "bg-lightsuccess text-success",
  primary: "bg-lightprimary text-primary",
  info: "bg-lightinfo text-info",
};

const timeAgo = (iso?: string | null) => {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
};

/** Same unified `/admin/dashboard/recent-activity` feed the desktop dashboard's RecentActivities card uses. */
const MobileRecentActivity = ({ activity, loading }: { activity: RecentActivityItem[]; loading?: boolean }) => {
  return (
    <div className="rounded-2xl bg-white dark:bg-darkgray p-5 shadow-xs">
      <h5 className="card-title mb-4">Recent Activities</h5>

      {loading ? (
        <p className="text-sm text-darklink py-4 text-center">Loading…</p>
      ) : activity.length === 0 ? (
        <p className="text-sm text-darklink py-4 text-center">No recent activity</p>
      ) : (
        <div className="flex flex-col gap-4">
          {activity.slice(0, 5).map((item, i) => {
            const meta = iconByType[item.type];
            return (
              <div key={i} className="flex items-start gap-3">
                <div className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center ${colorClasses[meta.color]}`}>
                  <Icon icon={meta.icon} width={16} height={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-dark dark:text-white truncate">{item.title}</p>
                  <p className="text-xs text-darklink truncate">{item.subtitle}</p>
                </div>
                <span className="text-[11px] text-darklink shrink-0">{timeAgo(item.occurred_at)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MobileRecentActivity;

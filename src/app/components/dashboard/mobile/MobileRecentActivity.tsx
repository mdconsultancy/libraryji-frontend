"use client";

import { Icon } from "@iconify/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { timeAgo } from "@/lib/timeAgo";
import type { RecentActivityItem, RecentActivityType } from "@/types";

const iconByType: Record<RecentActivityType, { icon: string; color: "success" | "primary" | "info" }> = {
  member_joined: { icon: "solar:user-plus-bold-duotone", color: "success" },
  payment_received: { icon: "solar:wallet-money-bold-duotone", color: "primary" },
  attendance_check_in: { icon: "solar:login-3-bold-duotone", color: "info" },
};

const colorClasses = {
  success: "bg-success text-white",
  primary: "bg-primary text-white",
  info: "bg-info text-dark",
};

/** Same unified `/admin/dashboard/recent-activity` feed the desktop dashboard's RecentActivities card uses. */
const MobileRecentActivity = ({
  activity,
  loading,
  hasMore,
  loadingMore,
  onLoadMore,
}: {
  activity: RecentActivityItem[];
  loading?: boolean;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}) => {
  return (
    <div className="rounded-2xl bg-white dark:bg-darkgray p-5 shadow-xs">
      <h5 className="card-title mb-4">Recent Activities</h5>

      {loading ? (
        <p className="text-sm text-darklink py-4 text-center">Loading…</p>
      ) : activity.length === 0 ? (
        <p className="text-sm text-darklink py-4 text-center">No recent activity</p>
      ) : (
        <>
          <ScrollArea className="max-h-[360px]">
            <div className="flex flex-col gap-4">
              {activity.map((item, i) => {
                const meta = iconByType[item.type];
                const seatNumber = item.type === "member_joined" ? item.meta?.seat_number : null;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center ${colorClasses[meta.color]}`}>
                      <Icon icon={meta.icon} width={16} height={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-dark dark:text-white truncate">{item.title}</p>
                      <p className="text-xs text-darklink truncate">
                        {item.subtitle}
                        {seatNumber ? ` · Seat ${seatNumber}` : ""}
                      </p>
                    </div>
                    <span className="text-[11px] text-darklink shrink-0">{timeAgo(item.occurred_at)}</span>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {hasMore && (
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={onLoadMore}
                disabled={loadingMore}
                className="text-sm text-primary font-medium hover:underline disabled:opacity-60"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MobileRecentActivity;

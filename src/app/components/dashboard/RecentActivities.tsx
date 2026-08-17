"use client";
import { Icon } from "@iconify/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { timeAgo } from "@/lib/timeAgo";
import type { RecentActivityItem, RecentActivityType } from "@/types";

const iconByType: Record<RecentActivityType, { icon: string; tone: string }> = {
  member_joined: { icon: "solar:user-plus-bold-duotone", tone: "bg-primary text-white" },
  payment_received: { icon: "solar:wallet-money-bold-duotone", tone: "bg-success text-white" },
  attendance_check_in: { icon: "solar:login-3-bold-duotone", tone: "bg-info text-dark" },
};

const RecentActivities = ({
  activity,
  hasMore,
  loadingMore,
  onLoadMore,
}: {
  activity: RecentActivityItem[];
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}) => {
  return (
    <div className="rounded-xl shadow-xs bg-white dark:bg-darkgray p-6 w-full">
      <h5 className="card-title mb-6">Recent Activities</h5>

      {activity.length === 0 ? (
        <p className="text-sm text-gray-500">No recent activity yet.</p>
      ) : (
        <>
          <ScrollArea className="max-h-[360px]">
            <ul className="flex flex-col gap-4">
              {activity.map((item, i) => {
                const meta = iconByType[item.type];
                const seatNumber = item.type === "member_joined" ? item.meta?.seat_number : null;
                return (
                  <li key={i} className="flex items-center gap-3">
                    <div className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center ${meta.tone}`}>
                      <Icon icon={meta.icon} width={18} height={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-dark dark:text-white truncate">{item.title}</p>
                      <p className="text-xs text-darklink truncate">
                        {item.subtitle}
                        {seatNumber ? ` · Seat ${seatNumber}` : ""}
                      </p>
                    </div>
                    <p className="text-xs text-darklink shrink-0">{timeAgo(item.occurred_at)}</p>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>

          {hasMore && (
            <div className="mt-4 flex justify-center">
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

export default RecentActivities;

"use client";
import { Icon } from "@iconify/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { RecentActivityItem, RecentActivityType } from "@/types";

const iconByType: Record<RecentActivityType, { icon: string; tone: string }> = {
  member_joined: { icon: "solar:user-plus-bold-duotone", tone: "bg-lightprimary text-primary" },
  payment_received: { icon: "solar:wallet-money-bold-duotone", tone: "bg-lightsuccess text-success" },
  attendance_check_in: { icon: "solar:login-3-bold-duotone", tone: "bg-lightinfo text-info" },
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

const RecentActivities = ({ activity }: { activity: RecentActivityItem[] }) => {
  return (
    <div className="rounded-xl shadow-xs bg-white dark:bg-darkgray p-6 w-full">
      <h5 className="card-title mb-6">Recent Activities</h5>

      {activity.length === 0 ? (
        <p className="text-sm text-gray-500">No recent activity yet.</p>
      ) : (
        <ScrollArea className="max-h-[360px]">
          <ul className="flex flex-col gap-4">
            {activity.map((item, i) => {
              const meta = iconByType[item.type];
              return (
                <li key={i} className="flex items-center gap-3">
                  <div className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center ${meta.tone}`}>
                    <Icon icon={meta.icon} width={18} height={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-dark dark:text-white truncate">{item.title}</p>
                    <p className="text-xs text-darklink truncate">{item.subtitle}</p>
                  </div>
                  <p className="text-xs text-darklink shrink-0">{timeAgo(item.occurred_at)}</p>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      )}
    </div>
  );
};

export default RecentActivities;

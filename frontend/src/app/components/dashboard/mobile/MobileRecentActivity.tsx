"use client";

import { Icon } from "@iconify/react";
import { useApi } from "@/hooks/useApi";
import type { Member, Payment } from "@/types";

interface ActivityItem {
  key: string;
  icon: string;
  color: "success" | "primary";
  title: string;
  subtitle: string;
  at: string | null;
}

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

/**
 * Merges two already-existing data sources — recent members (shared with the
 * desktop dashboard) and recent payments (its own small fetch, same pattern
 * as the rest of the app) — into one activity feed for the mobile view.
 */
const MobileRecentActivity = ({ members }: { members: Member[] }) => {
  const { data: paymentsPage, isLoading } = useApi<{ data: Payment[] }>("/admin/payments", { per_page: 3 });
  const payments = paymentsPage?.data ?? [];

  const items: ActivityItem[] = [
    ...members.slice(0, 3).map((m) => ({
      key: `member-${m.id}`,
      icon: "solar:user-plus-bold-duotone",
      color: "success" as const,
      title: `New student ${m.name} joined`,
      subtitle: m.subscriptions?.[0]?.seat ? `Seat ${m.subscriptions[0].seat.seat_number}` : m.member_code,
      at: m.join_date,
    })),
    ...payments.map((p) => ({
      key: `payment-${p.id}`,
      icon: "solar:wallet-money-bold-duotone",
      color: "primary" as const,
      title: `Fee collected from ${p.member?.name ?? "member"}`,
      subtitle: `Amount: ₹${Number(p.amount).toLocaleString("en-IN")}`,
      at: p.paid_at,
    })),
  ]
    .sort((a, b) => new Date(b.at ?? 0).getTime() - new Date(a.at ?? 0).getTime())
    .slice(0, 5);

  return (
    <div className="rounded-2xl bg-white dark:bg-darkgray p-5 shadow-xs">
      <h5 className="card-title mb-4">Recent Activities</h5>

      {isLoading ? (
        <p className="text-sm text-darklink py-4 text-center">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-darklink py-4 text-center">No recent activity</p>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div key={item.key} className="flex items-start gap-3">
              <div
                className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center ${
                  item.color === "success" ? "bg-lightsuccess text-success" : "bg-lightprimary text-primary"
                }`}
              >
                <Icon icon={item.icon} width={16} height={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-dark dark:text-white truncate">{item.title}</p>
                <p className="text-xs text-darklink truncate">{item.subtitle}</p>
              </div>
              <span className="text-[11px] text-darklink shrink-0">{timeAgo(item.at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MobileRecentActivity;

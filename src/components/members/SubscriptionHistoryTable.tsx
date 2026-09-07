"use client";

import { formatDisplay } from "@/lib/duration";
import type { MemberSubscription, SubscriptionStatus } from "@/types";

const statusStyles: Record<SubscriptionStatus, string> = {
  active: "bg-success/15 text-success",
  expired: "bg-warning/15 text-warning",
  cancelled: "bg-error/15 text-error",
};

function durationLabel(sub: MemberSubscription) {
  if (sub.duration_unit === "month" && sub.duration_months) return `${sub.duration_months} month${sub.duration_months > 1 ? "s" : ""}`;
  if (sub.duration_unit === "day" && sub.duration_days) return `${sub.duration_days} day${sub.duration_days > 1 ? "s" : ""}`;
  return sub.plan_name_snapshot || "—";
}

/** Read-only list of every subscription cycle a student has had — period,
 *  duration, fee, amount paid and status. Shared by the Renew dialog and the
 *  Edit-Student wizard. */
export default function SubscriptionHistoryTable({
  subscriptions,
  emptyText = "No previous history.",
}: {
  subscriptions: MemberSubscription[];
  emptyText?: string;
}) {
  if (!subscriptions || subscriptions.length === 0) {
    return <p className="py-3 text-center text-xs text-gray-500">{emptyText}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-xs">
        <thead className="bg-slate-50 dark:bg-darkgray/50 text-darklink">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Period</th>
            <th className="px-3 py-2 text-left font-medium">Duration</th>
            <th className="px-3 py-2 text-right font-medium">Fees</th>
            <th className="px-3 py-2 text-right font-medium">Paid</th>
            <th className="px-3 py-2 text-left font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((sub) => (
            <tr key={sub.id} className="border-t border-border">
              <td className="px-3 py-2 whitespace-nowrap">
                {formatDisplay(sub.start_date)} – {formatDisplay(sub.end_date)}
              </td>
              <td className="px-3 py-2">{durationLabel(sub)}</td>
              <td className="px-3 py-2 text-right">₹{Number(sub.amount).toLocaleString("en-IN")}</td>
              <td className="px-3 py-2 text-right">₹{Number(sub.paid_amount ?? 0).toLocaleString("en-IN")}</td>
              <td className="px-3 py-2">
                <span className={`rounded-full px-2 py-0.5 font-medium capitalize ${statusStyles[sub.status]}`}>
                  {sub.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

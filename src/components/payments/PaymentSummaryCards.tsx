"use client";

import { Icon } from "@iconify/react";
import type { PaymentSummary } from "@/types";
import { methodLabel } from "./PaymentFilters";

const money = (v: number | undefined) => `₹${Number(v ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

/** Totals for everything matching the current filters (all pages, not just the visible one). */
export default function PaymentSummaryCards({ summary }: { summary: PaymentSummary | undefined }) {
  const cards = [
    { label: "Transactions", value: String(summary?.count ?? 0), icon: "solar:bill-list-bold-duotone", tone: "bg-lightprimary text-primary" },
    { label: "Collected", value: money(summary?.total_collected), icon: "solar:wallet-money-bold-duotone", tone: "bg-lightsuccess text-success" },
    {
      label: `Pending${summary?.pending_count ? ` (${summary.pending_count})` : ""}`,
      value: money(summary?.total_pending),
      icon: "solar:hourglass-bold-duotone",
      tone: "bg-lightwarning text-warning",
    },
    { label: "Refunded", value: money(summary?.total_refunded), icon: "solar:undo-left-round-bold-duotone", tone: "bg-lighterror text-error" },
  ];
  const methods = Object.entries(summary?.by_method ?? {}).filter(([, v]) => Number(v) > 0);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-white dark:bg-darkgray p-3 flex items-center gap-3 min-w-0">
            <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${c.tone}`}>
              <Icon icon={c.icon} width={20} height={20} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-darklink truncate">{c.label}</p>
              <p className="text-base font-semibold text-dark dark:text-white truncate">{c.value}</p>
            </div>
          </div>
        ))}
      </div>
      {methods.length > 0 && (
        <p className="text-xs text-darklink flex flex-wrap gap-x-4 gap-y-1">
          <span>Collected by method:</span>
          {methods.map(([m, v]) => (
            <span key={m}>
              <span className="font-medium text-dark dark:text-white">{methodLabel(m)}</span> {money(Number(v))}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

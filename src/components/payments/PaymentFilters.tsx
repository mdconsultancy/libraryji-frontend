"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PaymentMethod, PaymentRange, PaymentStatus } from "@/types";

export interface PaymentFilterState {
  range: PaymentRange;
  from: string;
  to: string;
  status: PaymentStatus | "all";
  method: PaymentMethod | "all";
  type: "subscription" | "other" | "all";
  recordedBy: "admin" | "staff" | "all";
  minAmount: string;
  maxAmount: string;
}

export const defaultPaymentFilters: PaymentFilterState = {
  range: "all",
  from: "",
  to: "",
  status: "all",
  method: "all",
  type: "all",
  recordedBy: "all",
  minAmount: "",
  maxAmount: "",
};

export const PAYMENT_RANGES: { value: PaymentRange; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7", label: "Last 7 Days" },
  { value: "30", label: "Last 30 Days" },
  { value: "90", label: "Last 90 Days" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "this_year", label: "This Year" },
  { value: "custom", label: "Custom Date" },
];

const STATUSES: PaymentStatus[] = ["paid", "pending", "failed", "refunded"];
const METHODS: PaymentMethod[] = ["cash", "upi", "online", "offline"];

export const methodLabel = (m: string) => (m === "upi" ? "UPI" : m.charAt(0).toUpperCase() + m.slice(1));

/** Query params for /admin/payments and /admin/payments/export — one source of truth for both. */
export function paymentFilterParams(f: PaymentFilterState): Record<string, string | undefined> {
  const custom = f.range === "custom";
  return {
    range: f.range !== "all" ? f.range : undefined,
    from: custom && f.from ? f.from : undefined,
    to: custom && f.to ? f.to : undefined,
    status: f.status !== "all" ? f.status : undefined,
    payment_method: f.method !== "all" ? f.method : undefined,
    type: f.type !== "all" ? f.type : undefined,
    recorded_by: f.recordedBy !== "all" ? f.recordedBy : undefined,
    min_amount: f.minAmount || undefined,
    max_amount: f.maxAmount || undefined,
  };
}

/** How many filters differ from the defaults (for the "Filters (3)" badge / Clear button). */
export function activePaymentFilterCount(f: PaymentFilterState): number {
  return (Object.keys(defaultPaymentFilters) as (keyof PaymentFilterState)[]).filter(
    (k) => k !== "from" && k !== "to" && f[k] !== defaultPaymentFilters[k]
  ).length;
}

function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-darklink">{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Filter grid shared by the desktop toolbar and the mobile filter panel on the Students Fee page. */
export default function PaymentFilters({
  value,
  onChange,
  today,
  className = "",
}: {
  value: PaymentFilterState;
  onChange: (next: PaymentFilterState) => void;
  today: string;
  className?: string;
}) {
  const set = <K extends keyof PaymentFilterState>(key: K, v: PaymentFilterState[K]) => onChange({ ...value, [key]: v });

  return (
    <div className={`grid gap-3 ${className}`}>
      <FilterSelect
        label="Period"
        value={value.range}
        onChange={(v) => set("range", v)}
        options={PAYMENT_RANGES}
      />
      {value.range === "custom" && (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pay_from" className="text-xs text-darklink">From</Label>
            <Input id="pay_from" type="date" value={value.from} max={value.to || today} onChange={(e) => set("from", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pay_to" className="text-xs text-darklink">To</Label>
            <Input id="pay_to" type="date" value={value.to} min={value.from || undefined} max={today} onChange={(e) => set("to", e.target.value)} />
          </div>
        </>
      )}
      <FilterSelect
        label="Status"
        value={value.status}
        onChange={(v) => set("status", v)}
        options={[{ value: "all", label: "All statuses" }, ...STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))]}
      />
      <FilterSelect
        label="Method"
        value={value.method}
        onChange={(v) => set("method", v)}
        options={[{ value: "all", label: "All methods" }, ...METHODS.map((m) => ({ value: m, label: methodLabel(m) }))]}
      />
      <FilterSelect
        label="Type"
        value={value.type}
        onChange={(v) => set("type", v)}
        options={[
          { value: "all", label: "All types" },
          { value: "subscription", label: "Subscription" },
          { value: "other", label: "Other" },
        ]}
      />
      <FilterSelect
        label="Recorded By"
        value={value.recordedBy}
        onChange={(v) => set("recordedBy", v)}
        options={[
          { value: "all", label: "Anyone" },
          { value: "admin", label: "Admin" },
          { value: "staff", label: "Staff" },
        ]}
      />
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-darklink">Amount (₹)</Label>
        <div className="flex items-center gap-2">
          <Input type="number" min={0} placeholder="Min" value={value.minAmount} onChange={(e) => set("minAmount", e.target.value)} />
          <span className="text-darklink">–</span>
          <Input type="number" min={0} placeholder="Max" value={value.maxAmount} onChange={(e) => set("maxAmount", e.target.value)} />
        </div>
      </div>
    </div>
  );
}

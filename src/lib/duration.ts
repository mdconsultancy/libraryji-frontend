// Shared subscription date/duration helpers — used by the Add/Edit Member
// wizard and the Renew dialog so both compute end dates identically.

export type DurationUnit = "day" | "month" | "custom";

export const DURATION_UNITS: { label: string; value: DurationUnit; icon: string }[] = [
  { label: "Daily", value: "day", icon: "solar:sun-2-linear" },
  { label: "Monthly", value: "month", icon: "solar:calendar-linear" },
  { label: "Custom Date", value: "custom", icon: "solar:calendar-mark-linear" },
];

export function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export const todayIso = () => toIso(new Date());

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toIso(d);
}

export function addMonthsIso(iso: string, months: number): string {
  const d = new Date(iso + "T00:00:00");
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() !== day) d.setDate(0); // clamp e.g. Jan 31 + 1mo -> Feb 28/29
  return toIso(d);
}

export function recomputeEndDate(start: string, unit: DurationUnit, count: string): string | undefined {
  if (unit === "custom") return undefined;
  const n = Math.max(1, Number(count) || 1);
  return unit === "day" ? addDaysIso(start, n) : addMonthsIso(start, n);
}

/** Whole days from start to end (end exclusive of nothing — a plain date diff). */
export function daysBetweenIso(start: string, end: string): number {
  if (!start || !end) return 0;
  const a = new Date(start.slice(0, 10) + "T00:00:00").getTime();
  const b = new Date(end.slice(0, 10) + "T00:00:00").getTime();
  return Math.round((b - a) / 86_400_000);
}

export function formatDisplay(iso: string) {
  if (!iso) return "—";
  return new Date(iso.slice(0, 10) + "T00:00:00").toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

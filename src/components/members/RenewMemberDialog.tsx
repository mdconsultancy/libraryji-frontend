"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icon } from "@iconify/react";
import DatePicker from "@/components/form/DatePicker";
import SelectSeatModal from "@/components/members/SelectSeatModal";
import SubscriptionHistoryTable from "@/components/members/SubscriptionHistoryTable";
import { api, ApiError, invalidateMembers, invalidateDashboard } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { useMembershipPlanOptions } from "@/hooks/useOptions";
import { useToast } from "@/context/ToastContext";
import {
  addDaysIso,
  daysBetweenIso,
  formatDisplay,
  recomputeEndDate,
  todayIso,
  type DurationUnit,
  DURATION_UNITS,
} from "@/lib/duration";
import type { Member, MemberSubscription, Seat } from "@/types";

const PAYMENT_METHODS: { label: string; value: string }[] = [
  { label: "Pending / Pay Later", value: "pending" },
  { label: "Cash", value: "cash" },
  { label: "Online", value: "online" },
  { label: "Offline", value: "offline" },
  { label: "UPI", value: "upi" },
];

export default function RenewMemberDialog({
  memberId,
  open,
  onClose,
  onRenewed,
}: {
  memberId: number | null;
  open: boolean;
  onClose: () => void;
  onRenewed?: () => void;
}) {
  const toast = useToast();
  const { data: member, isLoading } = useApi<Member>(open && memberId ? `/admin/members/${memberId}` : null);
  const { data: seats } = useApi<Seat[]>(open ? "/admin/seats" : null);
  const membershipPlans = useMembershipPlanOptions();

  const base: MemberSubscription | undefined = useMemo(
    () => member?.subscriptions?.[0] ?? member?.latest_subscription ?? member?.active_subscription ?? undefined,
    [member]
  );
  const pastCycles = useMemo(
    () => (member?.subscriptions ?? []).filter((s) => s.id !== base?.id),
    [member, base]
  );

  const [startDate, setStartDate] = useState(todayIso());
  const [durationUnit, setDurationUnit] = useState<DurationUnit>("month");
  const [durationCount, setDurationCount] = useState("1");
  const [endDate, setEndDate] = useState(recomputeEndDate(todayIso(), "month", "1")!);
  const [amount, setAmount] = useState("");
  const [paidNow, setPaidNow] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [seatId, setSeatId] = useState<number | null>(null);
  const [membershipPlanId, setMembershipPlanId] = useState<number | null>(null);
  const [seatModalOpen, setSeatModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Prefill from the base subscription once it loads.
  useEffect(() => {
    if (!open || !base) return;
    const baseEnd = base.end_date?.slice(0, 10);
    const start = baseEnd && baseEnd >= todayIso() ? addDaysIso(baseEnd, 1) : todayIso();
    const unit: DurationUnit = base.duration_unit ?? "month";
    const count =
      unit === "month" ? String(base.duration_months ?? 1) : unit === "day" ? String(base.duration_days ?? 1) : "1";
    setStartDate(start);
    setDurationUnit(unit);
    setDurationCount(count);
    setEndDate(recomputeEndDate(start, unit, count) ?? base.end_date?.slice(0, 10) ?? start);
    setAmount(base.amount != null ? String(base.amount) : "");
    setPaidNow(base.amount != null ? String(base.amount) : "");
    setPaymentType("");
    setSeatId(base.seat_id ?? null);
    setMembershipPlanId(base.membership_plan_id ?? null);
    setFieldErrors({});
  }, [open, base]);

  const handlePlanChange = (planId: number | null) => {
    setMembershipPlanId(planId);
    if (!planId) return;
    const plan = membershipPlans.find((p) => p.id === planId);
    if (!plan) return;
    // Selecting a plan seeds the fee + duration from it (still editable after).
    setAmount(String(plan.price));
    setPaidNow(String(plan.price));
    const days = plan.duration_days || 30;
    setDurationUnit("day");
    setDurationCount(String(days));
    setEndDate(recomputeEndDate(startDate, "day", String(days)) ?? endDate);
  };

  const applyDates = (next: { start?: string; unit?: DurationUnit; count?: string }) => {
    const s = next.start ?? startDate;
    const u = next.unit ?? durationUnit;
    const c = next.count ?? durationCount;
    if (next.start !== undefined) setStartDate(s);
    if (next.unit !== undefined) setDurationUnit(u);
    if (next.count !== undefined) setDurationCount(c);
    const recomputed = recomputeEndDate(s, u, c);
    if (recomputed) setEndDate(recomputed);
  };

  const selectedSeat = seats?.find((s) => s.id === seatId);

  const isRealPayment = !!paymentType && paymentType !== "pending";
  const newFee = Number(amount || 0);
  // What's still unpaid on the CURRENT cycle before this renewal.
  const previousDue = Math.max(0, Number(base?.due_amount ?? 0));
  const totalPayable = newFee + previousDue;
  // "Amount received now" is recorded against the new cycle only, so it's
  // capped at the new plan fee — the old cycle's due stays on that cycle
  // (collect it separately from the profile's Payment ledger).
  const collectedNow = isRealPayment ? Number(paidNow || 0) : 0;
  const newCycleRemaining = Math.max(0, newFee - collectedNow);
  const remainingDue = newCycleRemaining + previousDue;
  const paidNowError =
    isRealPayment && (!paidNow || Number(paidNow) <= 0)
      ? "Enter the amount received now."
      : isRealPayment && Number(paidNow) > newFee + 0.01
        ? "Received amount can't exceed the new plan fee."
        : null;

  const canSubmit =
    !!startDate && !!endDate && !!amount && !!paymentType && !!seatId && !saving && !paidNowError;

  const handleSubmit = async () => {
    if (!base || !canSubmit) return;
    setSaving(true);
    setFieldErrors({});
    try {
      await api.post(`/admin/subscriptions/${base.id}/renew`, {
        seat_id: seatId,
        membership_plan_id: membershipPlanId ?? undefined,
        duration_unit: durationUnit,
        duration_months: durationUnit === "month" ? Number(durationCount) : undefined,
        duration_days: durationUnit === "day" ? Number(durationCount) : undefined,
        start_date: startDate,
        end_date: endDate,
        amount: Number(amount),
        payment_type: isRealPayment ? paymentType : undefined,
        paid_amount: isRealPayment ? Number(paidNow || amount) : undefined,
        paid_at: startDate,
      });
      toast.success("Membership renewed.");
      invalidateMembers();
      invalidateDashboard();
      onRenewed?.();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.errors || {});
        toast.error(err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const fieldError = (f: string) => fieldErrors[f]?.[0];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="solar:refresh-circle-bold-duotone" width={20} height={20} className="text-primary" />
            Renew Membership{member ? ` — ${member.name}` : ""}
          </DialogTitle>
        </DialogHeader>

        {isLoading || !base ? (
          <p className="py-10 text-center text-sm text-gray-500">
            {isLoading ? "Loading..." : "This student has no subscription to renew yet."}
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-4">
              {/* What the student currently holds — so it's clear what's being renewed. */}
              <div className="rounded-xl border border-border bg-lightprimary/30 p-3 dark:border-darkborder dark:bg-white/5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-darklink">Current Membership</p>
                <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <span className="text-darklink">Plan</span>
                  <span className="font-medium text-dark dark:text-white">{base.plan_name_snapshot || "—"}</span>
                  <span className="text-darklink">Period</span>
                  <span className="font-medium text-dark dark:text-white">
                    {formatDisplay(base.start_date)} – {formatDisplay(base.end_date)}
                  </span>
                  <span className="text-darklink">Fee</span>
                  <span className="font-medium text-dark dark:text-white">
                    ₹{Number(base.amount ?? 0).toLocaleString("en-IN")} (paid ₹{Number(base.paid_amount ?? 0).toLocaleString("en-IN")})
                  </span>
                  <span className="text-darklink">Seat</span>
                  <span className="font-medium text-dark dark:text-white">{base.seat?.seat_number ? `Seat ${base.seat.seat_number}` : "—"}</span>
                </div>
              </div>

              {membershipPlans.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <Label>Membership Plan</Label>
                  <Select
                    value={membershipPlanId ? String(membershipPlanId) : "none"}
                    onValueChange={(v) => handlePlanChange(v === "none" ? null : Number(v))}
                  >
                    <SelectTrigger><SelectValue placeholder="No plan — custom fee & duration" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No plan — custom fee &amp; duration</SelectItem>
                      {membershipPlans.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name} — ₹{p.price} ({p.duration_days} days)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Start Date</Label>
                  <DatePicker value={startDate} onChange={(v) => applyDates({ start: v })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>End Date</Label>
                  <DatePicker
                    value={endDate}
                    // Always editable — manually picking a date switches the
                    // duration to "Custom Date" so it isn't recomputed away.
                    onChange={(v) => {
                      setEndDate(v);
                      setDurationUnit("custom");
                    }}
                  />
                  <span className="text-[11px] text-darklink">
                    {daysBetweenIso(startDate, endDate)} days
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-[1.4fr_1fr] gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Duration</Label>
                  <Select value={durationUnit} onValueChange={(v) => applyDates({ unit: v as DurationUnit })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DURATION_UNITS.map((u) => (
                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {durationUnit !== "custom" && (
                  <div className="flex flex-col gap-1.5">
                    <Label>{durationUnit === "day" ? "Days" : "Months"}</Label>
                    <Input
                      type="number"
                      min="1"
                      value={durationCount}
                      onChange={(e) => applyDates({ count: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Fees Amount (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setPaidNow(e.target.value); }}
                  placeholder="e.g. 500"
                />
                {fieldError("amount") && <p className="text-xs text-error">{fieldError("amount")}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Payment Type</Label>
                <Select value={paymentType} onValueChange={setPaymentType}>
                  <SelectTrigger><SelectValue placeholder="— Select payment type —" /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isRealPayment && (
                <div className="flex flex-col gap-1.5">
                  <Label>Amount Received Now (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    inputMode="decimal"
                    value={paidNow}
                    onChange={(e) => setPaidNow(e.target.value)}
                    placeholder={`e.g. ${newFee}`}
                  />
                  {paidNowError && <p className="text-xs text-error">{paidNowError}</p>}
                </div>
              )}

              {/* Money summary — new fee + whatever is still due on the old cycle. */}
              <div className="rounded-xl border border-border p-3 text-xs dark:border-darkborder">
                <div className="flex justify-between py-0.5">
                  <span className="text-darklink">New Plan Fee</span>
                  <span className="font-medium text-dark dark:text-white">₹{newFee.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-darklink">Previous Due</span>
                  <span className={`font-medium ${previousDue > 0 ? "text-error" : "text-dark dark:text-white"}`}>
                    ₹{previousDue.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="mt-1 flex justify-between border-t border-border pt-1.5 dark:border-darkborder">
                  <span className="font-semibold text-dark dark:text-white">Total Payable</span>
                  <span className="font-semibold text-dark dark:text-white">₹{totalPayable.toLocaleString("en-IN")}</span>
                </div>
                {isRealPayment && (
                  <>
                    <div className="flex justify-between py-0.5">
                      <span className="text-darklink">Received Now</span>
                      <span className="font-medium text-success">₹{collectedNow.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-darklink">Remaining Due</span>
                      <span className={`font-semibold ${remainingDue > 0 ? "text-error" : "text-success"}`}>
                        ₹{remainingDue.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </>
                )}
                {previousDue > 0 && (
                  <p className="mt-1.5 text-[11px] text-darklink">
                    Previous due stays on the old cycle — collect it from the student&apos;s Payment ledger.
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Seat</Label>
                <button
                  type="button"
                  onClick={() => setSeatModalOpen(true)}
                  className="flex items-center gap-3 rounded-xl border border-border bg-lightprimary/40 p-3 text-left hover:border-primary/40 dark:border-darkborder dark:bg-white/5"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shrink-0">
                    <Icon icon="solar:armchair-2-bold" width={18} height={18} />
                  </div>
                  <span className="text-sm font-semibold text-dark dark:text-white">
                    {selectedSeat ? `Seat ${selectedSeat.seat_number}` : "Choose a seat"}
                  </span>
                  <Icon icon="solar:alt-arrow-right-linear" width={18} height={18} className="ml-auto text-darklink" />
                </button>
                {fieldError("seat_id") && <p className="text-xs text-error">{fieldError("seat_id")}</p>}
              </div>
            </div>

            <div className="mt-4">
              <h6 className="mb-2 text-sm font-semibold">Renewal History</h6>
              <SubscriptionHistoryTable subscriptions={pastCycles} emptyText="This is the first renewal." />
            </div>

            <DialogFooter className="mt-4 flex gap-2">
              <Button type="button" variant="outline" className="rounded-md" onClick={onClose}>Cancel</Button>
              <Button type="button" className="rounded-md flex items-center gap-1.5" disabled={!canSubmit} onClick={handleSubmit}>
                {saving ? <Icon icon="svg-spinners:180-ring" width={16} height={16} /> : <Icon icon="solar:refresh-linear" width={16} height={16} />}
                {saving ? "Renewing..." : "Renew"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>

      <SelectSeatModal
        open={seatModalOpen}
        onClose={() => setSeatModalOpen(false)}
        seats={seats ?? []}
        seatsLoading={!seats}
        selectedId={seatId}
        onConfirm={(id) => {
          setSeatId(id);
          setSeatModalOpen(false);
        }}
      />
    </Dialog>
  );
}

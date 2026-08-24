"use client";

import { useMemo, useState } from "react";
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
import { api, ApiError, invalidateMembers, invalidatePayments } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/context/ToastContext";
import type { MemberSubscription, Payment, PaymentMethod, Paginated } from "@/types";

const methods: PaymentMethod[] = ["cash", "online", "offline", "upi"];

const todayIso = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

function money(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

interface Props {
  memberId: number;
  subscription?: MemberSubscription | null;
  /** Lets the caller (the member view dialog) refresh its own copy of the member/subscription totals. */
  onChanged?: () => void;
}

const emptyForm = { paid_at: todayIso(), amount: "", payment_method: "cash" as PaymentMethod, notes: "" };

export default function PaymentLedgerSection({ memberId, subscription, onChanged }: Props) {
  const toast = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  const { data: payments, isLoading, mutate } = useApi<Paginated<Payment>>(
    "/admin/payments",
    { member_id: memberId, per_page: 100 }
  );

  const subscriptionPayments = useMemo(
    () =>
      (payments?.data ?? [])
        .filter((p) => p.member_subscription_id === subscription?.id)
        .sort((a, b) => new Date(b.paid_at || b.created_at || 0).getTime() - new Date(a.paid_at || a.created_at || 0).getTime()),
    [payments, subscription?.id]
  );

  if (!subscription) return null;

  const total = Number(subscription.amount || 0);
  const received = Number(subscription.paid_amount ?? 0);
  const due = Number(subscription.due_amount ?? Math.max(total - received, 0));

  const fieldError = (field: string) => fieldErrors[field]?.[0];

  const amountError =
    form.amount !== "" && Number(form.amount) > due + 0.01
      ? `Amount can't exceed the remaining due of ${money(due)}.`
      : form.amount !== "" && Number(form.amount) <= 0
        ? "Enter an amount greater than 0."
        : null;

  const openForm = () => {
    setForm({ ...emptyForm, amount: due > 0 ? String(due) : "" });
    setFieldErrors({});
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (amountError) return;
    setSaving(true);
    setFieldErrors({});
    try {
      await api.post("/admin/payments", {
        member_id: memberId,
        member_subscription_id: subscription.id,
        type: "subscription",
        amount: Number(form.amount),
        payment_method: form.payment_method,
        paid_at: form.paid_at,
        notes: form.notes || null,
      });
      toast.success("Payment recorded.");
      setFormOpen(false);
      mutate();
      invalidateMembers();
      invalidatePayments();
      onChanged?.();
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.errors || {});
        toast.error(err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h6 className="text-sm font-semibold">Fee / Payment Ledger</h6>
        {due > 0 && !formOpen && (
          <Button type="button" size="sm" variant="lightprimary" className="flex items-center gap-1.5" onClick={openForm}>
            <Icon icon="solar:add-circle-linear" width={16} height={16} />
            Add Payment
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-lg bg-lightprimary/60 dark:bg-primary/10 p-3 text-center">
          <p className="text-[11px] text-darklink">Total</p>
          <p className="text-sm font-bold text-dark dark:text-white">{money(total)}</p>
        </div>
        <div className="rounded-lg bg-lightsuccess/60 dark:bg-success/10 p-3 text-center">
          <p className="text-[11px] text-darklink">Received</p>
          <p className="text-sm font-bold text-success">{money(received)}</p>
        </div>
        <div className={`rounded-lg p-3 text-center ${due > 0 ? "bg-lighterror/60 dark:bg-error/10" : "bg-lightsuccess/60 dark:bg-success/10"}`}>
          <p className="text-[11px] text-darklink">Due</p>
          <p className={`text-sm font-bold ${due > 0 ? "text-error" : "text-success"}`}>{money(due)}</p>
        </div>
      </div>

      {formOpen && (
        <div className="rounded-xl border border-border p-3 mb-3 flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Payment Date</Label>
              <DatePicker value={form.paid_at} onChange={(v) => setForm((f) => ({ ...f, paid_at: v }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ledger-amount">Amount (₹)</Label>
              <Input
                id="ledger-amount"
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
              {(amountError || fieldError("amount")) && (
                <p className="text-xs text-error">{amountError || fieldError("amount")}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Payment Method</Label>
              <Select value={form.payment_method} onValueChange={(v) => setForm((f) => ({ ...f, payment_method: v as PaymentMethod }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {methods.map((m) => (
                    <SelectItem key={m} value={m} className="capitalize">{m.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ledger-notes">Notes (optional)</Label>
              <Input id="ledger-notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" size="sm" className="rounded-md" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="button" size="sm" className="rounded-md" disabled={saving || !form.amount || !!amountError} onClick={handleSubmit}>
              {saving ? "Saving..." : "Save Payment"}
            </Button>
          </div>
        </div>
      )}

      <div className="max-h-40 overflow-y-auto flex flex-col gap-2 rounded-lg border border-border p-3">
        {isLoading ? (
          <p className="text-sm text-gray-500 py-3 text-center">Loading...</p>
        ) : subscriptionPayments.length === 0 ? (
          <p className="text-sm text-gray-500 py-3 text-center">No payments recorded yet.</p>
        ) : (
          subscriptionPayments.map((p) => (
            <div key={p.id} className="flex items-center justify-between border-b border-border pb-2 last:border-none last:pb-0">
              <div>
                <p className="text-sm font-medium text-dark dark:text-white">
                  {money(Number(p.amount))} <span className="text-xs font-normal text-darklink capitalize">· {p.payment_method.replace("_", " ")}</span>
                </p>
                <p className="text-xs text-darklink">
                  {p.paid_at ? new Date(p.paid_at).toLocaleDateString("en-IN") : "—"}
                  {p.creator?.name ? ` · by ${p.creator.name}` : ""}
                </p>
              </div>
              <span className="text-[10px] font-semibold uppercase text-darklink">{p.invoice_number}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

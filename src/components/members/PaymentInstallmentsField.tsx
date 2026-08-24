"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "@iconify/react";
import DatePicker from "@/components/form/DatePicker";

export interface InstallmentRow {
  /** Stable local key for list rendering — not sent to the server. */
  key: string;
  /** Present only for a row sourced from an existing Payment row (edit mode). */
  paymentId?: number;
  amount: string;
  paid_at: string;
  /** Snapshot of the values this row loaded with — lets submit skip a PUT for a row nobody touched. */
  originalAmount?: string;
  originalPaidAt?: string;
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export const todayIso = () => toIso(new Date());

export function newInstallmentRow(amount = ""): InstallmentRow {
  return {
    key: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    amount,
    paid_at: todayIso(),
  };
}

export function installmentsTotal(rows: InstallmentRow[]): number {
  return rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
}

interface Props {
  rows: InstallmentRow[];
  onChange: (rows: InstallmentRow[]) => void;
  /** Called when the user confirms removing a row — the caller owns the confirm step and, for
   * rows with a paymentId, the delete API call; this component never talks to the API itself. */
  onRemoveRow: (row: InstallmentRow) => void;
  feesAmount: number;
  disabled?: boolean;
}

export default function PaymentInstallmentsField({ rows, onChange, onRemoveRow, feesAmount, disabled }: Props) {
  const total = installmentsTotal(rows);
  const overCap = feesAmount > 0 && total > feesAmount + 0.01;

  const updateRow = (key: string, patch: Partial<InstallmentRow>) => {
    onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  return (
    <div className="flex flex-col gap-2">
      <Label>Installments *</Label>
      <div className="flex flex-col gap-2">
        {rows.map((row) => {
          const amountError = row.amount !== "" && Number(row.amount) <= 0;
          return (
            <div key={row.key} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Icon icon="solar:wallet-money-linear" width={16} height={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-darklink" />
                  <Input
                    type="number"
                    min="0"
                    inputMode="decimal"
                    placeholder="Amount"
                    className="pl-9"
                    value={row.amount}
                    disabled={disabled}
                    onChange={(e) => updateRow(row.key, { amount: e.target.value })}
                  />
                </div>
                <div className="flex-1">
                  <DatePicker value={row.paid_at} onChange={(v) => updateRow(row.key, { paid_at: v })} disabled={disabled} />
                </div>
                <button
                  type="button"
                  disabled={disabled || rows.length <= 1}
                  onClick={() => onRemoveRow(row)}
                  className="shrink-0 rounded-md p-2 text-error transition-colors hover:bg-lighterror disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Remove installment"
                >
                  <Icon icon="solar:trash-bin-trash-linear" width={18} height={18} />
                </button>
              </div>
              {amountError && <p className="text-xs text-error">Enter an amount greater than 0.</p>}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange([...rows, newInstallmentRow()])}
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-primary hover:underline disabled:opacity-50"
      >
        <Icon icon="solar:add-circle-linear" width={18} height={18} />
        Add Installment
      </button>

      <div className="flex items-center justify-between rounded-lg bg-lightprimary/40 px-3 py-2 dark:bg-white/5">
        <span className="text-xs font-medium text-darklink">Total Paid</span>
        <span className={`text-sm font-bold ${overCap ? "text-error" : "text-dark dark:text-white"}`}>
          ₹{total.toLocaleString("en-IN")}
        </span>
      </div>
      {overCap && <p className="text-xs text-error">Total paid can&apos;t exceed the fees amount.</p>}
    </div>
  );
}

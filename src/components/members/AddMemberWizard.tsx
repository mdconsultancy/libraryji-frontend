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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Icon } from "@iconify/react";
import DatePicker from "@/components/form/DatePicker";
import PhoneInput from "@/components/form/PhoneInput";
import ImageUploadField from "@/components/form/ImageUploadField";
import FileUploadField from "@/components/form/FileUploadField";
import DeleteConfirmDialog from "@/components/shared/DeleteConfirmDialog";
import PaymentInstallmentsField, {
  installmentsTotal,
  newInstallmentRow,
  type InstallmentRow,
} from "@/components/members/PaymentInstallmentsField";
import { api, ApiError, invalidateMembers, invalidatePayments } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import { useMembershipPlanOptions } from "@/hooks/useOptions";
import { useToast } from "@/context/ToastContext";
import { useUploadLimits } from "@/hooks/useUploadLimits";
import type { Member, MemberSubscription, Seat, SeatCategory, SeatStatus, PaymentMethod, MemberGender } from "@/types";

interface AddMemberWizardProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** Set for the Edit flow — the wizard fetches this member (+ active subscription) and prefills every step from it. */
  memberId?: number;
  /** Set when opened via a Lead's "Convert" action — seeds Step 1 and marks the lead converted on success. */
  prefill?: { name?: string; phone?: string; whatsapp_number?: string; leadId?: number };
}

type DurationUnit = "day" | "month" | "custom";

const DURATION_UNITS: { label: string; value: DurationUnit; icon: string }[] = [
  { label: "Daily", value: "day", icon: "solar:sun-2-linear" },
  { label: "Monthly", value: "month", icon: "solar:calendar-linear" },
  { label: "Custom Date", value: "custom", icon: "solar:calendar-mark-linear" },
];

type PaymentTypeChoice = PaymentMethod | "pending";

const PAYMENT_METHODS: { label: string; value: PaymentTypeChoice }[] = [
  { label: "Pending / Pay Later", value: "pending" },
  { label: "Cash", value: "cash" },
  { label: "Online", value: "online" },
  { label: "Offline", value: "offline" },
  { label: "UPI", value: "upi" },
];

const seatCardStyles: Record<SeatStatus, { face: string; ring: string }> = {
  available: { face: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400", ring: "" },
  occupied: { face: "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400", ring: "" },
  reserved: { face: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400", ring: "" },
  maintenance: { face: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300", ring: "" },
};

function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toIso(d);
}

function addMonthsIso(iso: string, months: number): string {
  const d = new Date(iso + "T00:00:00");
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() !== day) d.setDate(0); // clamp e.g. Jan 31 + 1mo -> Feb 28/29
  return toIso(d);
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function formatDisplay(iso: string) {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const todayIso = () => toIso(new Date());

const emptyDetails = {
  name: "",
  phone: "",
  whatsapp: "",
  whatsappSameAsPhone: true,
  notes: "",
  email: "",
  address: "",
  date_of_birth: "",
  gender: "" as MemberGender | "",
  id_proof_type: "",
  id_proof_number: "",
};
const freshMembership = () => ({
  start_date: todayIso(),
  durationUnit: "month" as DurationUnit,
  durationCount: "1",
  end_date: addMonthsIso(todayIso(), 1),
  amount: "",
  installmentRows: [] as InstallmentRow[],
  isPartialPayment: false,
  payment_type: "" as PaymentTypeChoice | "",
  seat_id: null as number | null,
  membership_plan_id: null as number | null,
});

const STEP_META = [
  { icon: "solar:user-id-linear", tone: "bg-primary", label: "Student Details", subtitle: "Basic information" },
  { icon: "solar:wallet-money-bold-duotone", tone: "bg-success", label: "Fees & Seat", subtitle: "Payment and seat details" },
  { icon: "solar:gallery-wide-linear", tone: "bg-info", label: "Documents", subtitle: "Photo & ID proof" },
];

function SelectSeatModal({
  open,
  onClose,
  seats,
  seatsLoading,
  selectedId,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  seats: Seat[];
  seatsLoading: boolean;
  selectedId: number | null;
  onConfirm: (id: number) => void;
}) {
  const [category, setCategory] = useState<SeatCategory>("regular");
  const [pending, setPending] = useState<number | null>(selectedId);

  useEffect(() => {
    if (open) {
      setPending(selectedId);
      const current = seats.find((s) => s.id === selectedId);
      if (current) setCategory(current.category);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const counts = useMemo(() => {
    const byCategory: Record<SeatCategory, Seat[]> = { regular: [], rotation: [] };
    for (const s of seats) byCategory[s.category]?.push(s);
    return byCategory;
  }, [seats]);

  const visibleSeats = counts[category] ?? [];
  const freeCount = visibleSeats.filter((s) => s.status === "available").length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="solar:armchair-2-bold-duotone" width={20} height={20} className="text-primary" />
            Select Seat
          </DialogTitle>
        </DialogHeader>

        <Tabs value={category} onValueChange={(v) => setCategory(v as SeatCategory)}>
          <TabsList className="w-full">
            <TabsTrigger value="regular" className="flex-1 flex items-center gap-1.5">
              <Icon icon="solar:armchair-2-linear" width={16} height={16} />
              Regular
              <span className="text-[10px] opacity-80">{counts.regular.filter((s) => s.status === "available").length} free</span>
            </TabsTrigger>
            <TabsTrigger value="rotation" className="flex-1 flex items-center gap-1.5">
              <Icon icon="solar:refresh-linear" width={16} height={16} />
              Rotation
              <span className="text-[10px] opacity-80">{counts.rotation.filter((s) => s.status === "available").length} free</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-4 text-xs text-darklink">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Free</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Filled</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-primary" /> Selected</span>
        </div>

        <div className="max-h-72 overflow-y-auto">
          {seatsLoading ? (
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-xl bg-gray-100 dark:bg-darkgray" />
              ))}
            </div>
          ) : visibleSeats.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">No {category} seats configured yet.</p>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              {visibleSeats.map((seat) => {
                const selected = seat.id === pending;
                const selectable = seat.status === "available" || selected;
                return (
                  <button
                    key={seat.id}
                    type="button"
                    disabled={!selectable}
                    onClick={() => setPending(seat.id)}
                    title={seat.seat_number}
                    className={cn(
                      "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl border text-xs font-bold transition-colors",
                      selected
                        ? "bg-primary text-white border-primary"
                        : selectable
                          ? `${seatCardStyles[seat.status].face} border-transparent hover:border-primary/40 cursor-pointer`
                          : "bg-lightgray text-gray-400 dark:bg-white/5 border-transparent cursor-not-allowed opacity-60"
                    )}
                  >
                    <Icon icon="solar:armchair-2-bold" width={18} height={18} />
                    {seat.seat_number}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-xs text-darklink">{freeCount} of {visibleSeats.length} {category} seats free.</p>

        <DialogFooter className="flex gap-2">
          <Button type="button" variant="outline" className="rounded-md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-md flex items-center gap-1.5"
            disabled={!pending}
            onClick={() => pending && onConfirm(pending)}
          >
            <Icon icon="solar:check-circle-bold" width={16} height={16} />
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AddMemberWizard({ open, onClose, onSaved, memberId, prefill }: AddMemberWizardProps) {
  const isEdit = !!memberId;
  const toast = useToast();
  const uploadLimits = useUploadLimits();
  const [step, setStep] = useState(1);
  const [details, setDetails] = useState(emptyDetails);
  const [membership, setMembership] = useState(freshMembership);
  const [photo, setPhoto] = useState<File | null>(null);
  const [idProofFront, setIdProofFront] = useState<File | null>(null);
  const [idProofBack, setIdProofBack] = useState<File | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [seatModalOpen, setSeatModalOpen] = useState(false);
  // Whether the subscription being edited already had recorded payment(s) for its
  // partial-payment installments before this edit session started — determines
  // whether the first installment rides along on the subscription PUT (fresh
  // payment, same as create) or every row is synced individually (existing history).
  const [hadExistingPayments, setHadExistingPayments] = useState(false);
  const [rowDeleteTarget, setRowDeleteTarget] = useState<InstallmentRow | null>(null);
  const [rowDeleting, setRowDeleting] = useState(false);

  const { data: editingMember, isLoading: memberLoading } = useApi<Member>(
    open && isEdit ? `/admin/members/${memberId}` : null
  );
  const { data: seats, isLoading: seatsLoading } = useApi<Seat[]>(open ? "/admin/seats" : null);
  const membershipPlans = useMembershipPlanOptions();

  useEffect(() => {
    if (!open) return;
    if (isEdit) return; // wait for editingMember to load, handled in the next effect
    setStep(1);
    setDetails(
      prefill
        ? {
            ...emptyDetails,
            name: prefill.name ?? "",
            phone: prefill.phone ?? "",
            whatsapp: prefill.whatsapp_number ?? "",
            whatsappSameAsPhone: !prefill.whatsapp_number || prefill.whatsapp_number === prefill.phone,
          }
        : emptyDetails
    );
    setMembership(freshMembership());
    setPhoto(null);
    setIdProofFront(null);
    setIdProofBack(null);
    setExistingPhotoUrl(null);
    setFieldErrors({});
    setHadExistingPayments(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit]);

  useEffect(() => {
    if (!open || !isEdit || !editingMember) return;
    const sub = editingMember.active_subscription;
    const payment = editingMember.payments?.find((p) => p.member_subscription_id === sub?.id);
    // Every paid Payment row already recorded against this subscription cycle —
    // these become the pre-filled, editable installment rows below.
    const subPayments = (editingMember.payments ?? [])
      .filter((p) => p.member_subscription_id === sub?.id && p.status === "paid")
      .sort((a, b) => new Date(a.paid_at || a.created_at || 0).getTime() - new Date(b.paid_at || b.created_at || 0).getTime());
    const isPartial =
      sub?.paid_amount != null && sub?.amount != null && Number(sub.paid_amount) < Number(sub.amount);
    // Any real Payment rows for this subscription (even if they now sum to
    // the full fee, e.g. 300 + 200 = 500) must still open the installments
    // editor pre-filled — gating this on `isPartial` alone hid a fully-paid
    // subscription's own installment history the moment its last row was
    // added, which looked like the rows had silently vanished.
    const hasPaymentHistory = subPayments.length > 0;
    setStep(1);
    setDetails({
      name: editingMember.name,
      phone: editingMember.phone,
      whatsapp: editingMember.whatsapp_number ?? "",
      whatsappSameAsPhone: !editingMember.whatsapp_number || editingMember.whatsapp_number === editingMember.phone,
      notes: editingMember.notes ?? "",
      email: editingMember.email ?? "",
      address: editingMember.address ?? "",
      date_of_birth: editingMember.date_of_birth ?? "",
      gender: editingMember.gender ?? "",
      id_proof_type: editingMember.id_proof_type ?? "",
      id_proof_number: editingMember.id_proof_number ?? "",
    });

    // Older subscriptions (created before duration_unit/duration_days were
    // tracked) fall back to "custom" — everything created since always has
    // duration_unit set, so the wizard restores the exact original choice
    // (Daily/Monthly/Custom Date) instead of always showing "Custom Date".
    const durationUnit: DurationUnit = sub?.duration_unit ?? "custom";
    const durationCount =
      durationUnit === "month"
        ? String(sub?.duration_months ?? 1)
        : durationUnit === "day"
          ? String(sub?.duration_days ?? 1)
          : "1";

    setMembership({
      start_date: sub?.start_date ?? todayIso(),
      durationUnit,
      durationCount,
      end_date: sub?.end_date ?? addMonthsIso(todayIso(), 1),
      amount: sub?.amount ? String(sub.amount) : "",
      // A subscription only "was" a partial payment when paid_amount was
      // recorded and is strictly less than the full amount — fully paid
      // (paid_amount === amount) or absent both mean the toggle stays off.
      installmentRows: hasPaymentHistory
        ? subPayments.map((p) => ({
            key: `existing-${p.id}`,
            paymentId: p.id,
            amount: String(p.amount),
            paid_at: p.paid_at ? p.paid_at.slice(0, 10) : todayIso(),
            originalAmount: String(p.amount),
            originalPaidAt: p.paid_at ? p.paid_at.slice(0, 10) : todayIso(),
          }))
        : isPartial
          ? [newInstallmentRow(String(sub?.paid_amount ?? ""))]
          : [],
      isPartialPayment: hasPaymentHistory || isPartial,
      payment_type: (payment?.payment_method as PaymentMethod) ?? "",
      seat_id: sub?.seat_id ?? null,
      membership_plan_id: sub?.membership_plan_id ?? null,
    });
    setHadExistingPayments(hasPaymentHistory);
    setPhoto(null);
    setIdProofFront(null);
    setIdProofBack(null);
    setExistingPhotoUrl(editingMember.photo_url);
    setFieldErrors({});
  }, [open, isEdit, editingMember]);

  const fieldError = (field: string) => fieldErrors[field]?.[0];

  const selectedSeat = useMemo(() => seats?.find((s) => s.id === membership.seat_id), [seats, membership.seat_id]);

  const canGoStep2 = details.name.trim() !== "" && details.phone.trim() !== "";
  const isRealPayment = !!membership.payment_type && membership.payment_type !== "pending";
  const showPartialPaymentFields = isRealPayment && membership.isPartialPayment;
  const installmentsPaidTotal = installmentsTotal(membership.installmentRows);
  const installmentsError = !showPartialPaymentFields
    ? null
    : membership.installmentRows.length === 0 || installmentsPaidTotal <= 0
      ? "Enter the amount collected so far."
      : membership.installmentRows.some((r) => r.amount !== "" && Number(r.amount) <= 0)
        ? "Each installment amount must be greater than zero."
        : installmentsPaidTotal > Number(membership.amount || 0) + 0.01
          ? "Total paid can't exceed the fees amount."
          : null;
  // Amount is the subscription's total fee, independent of whether it's
  // been collected yet — always required, "Pending" or not. Hiding it for
  // Pending used to mean the fee was never actually recorded (silently
  // saved as ₹0 on the backend), which broke the fee-status/amount shown
  // everywhere downstream (member list, dashboard, statements).
  const canSubmit =
    !!membership.start_date &&
    !!membership.end_date &&
    !!membership.payment_type &&
    !!membership.seat_id &&
    !!membership.amount &&
    !installmentsError;

  const recomputeEndDate = (start: string, unit: DurationUnit, count: string) => {
    if (unit === "custom") return undefined;
    const n = Math.max(1, Number(count) || 1);
    return unit === "day" ? addDaysIso(start, n) : addMonthsIso(start, n);
  };

  const setStartDate = (start_date: string) => {
    setMembership((m) => ({
      ...m,
      start_date,
      end_date: recomputeEndDate(start_date, m.durationUnit, m.durationCount) ?? m.end_date,
    }));
  };

  const setDurationUnit = (durationUnit: DurationUnit) => {
    setMembership((m) => ({
      ...m,
      durationUnit,
      end_date: recomputeEndDate(m.start_date, durationUnit, m.durationCount) ?? m.end_date,
    }));
  };

  const setDurationCount = (durationCount: string) => {
    setMembership((m) => ({
      ...m,
      durationCount,
      end_date: recomputeEndDate(m.start_date, m.durationUnit, durationCount) ?? m.end_date,
    }));
  };

  const confirmRemoveInstallmentRow = async () => {
    if (!rowDeleteTarget?.paymentId) return;
    setRowDeleting(true);
    try {
      await api.delete(`/admin/payments/${rowDeleteTarget.paymentId}`);
      setMembership((m) => ({
        ...m,
        installmentRows: m.installmentRows.filter((r) => r.key !== rowDeleteTarget.key),
      }));
      invalidateMembers();
      invalidatePayments();
      setRowDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to remove installment.");
    } finally {
      setRowDeleting(false);
    }
  };

  const markLeadConverted = async (leadId: number, memberId: number) => {
    try {
      await api.patch(`/admin/leads/${leadId}`, { status: "converted", converted_member_id: memberId });
    } catch {
      // Best-effort — the member is already created either way.
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setFieldErrors({});
    try {
      const whatsapp = details.whatsappSameAsPhone || !details.whatsapp ? details.phone : details.whatsapp;

      const memberFd = new FormData();
      memberFd.append("name", details.name);
      memberFd.append("phone", details.phone);
      memberFd.append("whatsapp_number", whatsapp);
      memberFd.append("notes", details.notes ?? "");
      if (details.email) memberFd.append("email", details.email);
      if (details.address) memberFd.append("address", details.address);
      if (details.date_of_birth) memberFd.append("date_of_birth", details.date_of_birth);
      if (details.gender) memberFd.append("gender", details.gender);
      if (details.id_proof_type) memberFd.append("id_proof_type", details.id_proof_type);
      if (details.id_proof_number) memberFd.append("id_proof_number", details.id_proof_number);
      if (!isEdit) {
        memberFd.append("join_date", membership.start_date);
        memberFd.append("status", "active");
      }
      if (photo) memberFd.append("photo", photo);
      if (idProofFront) memberFd.append("id_proof_front", idProofFront);
      if (idProofBack) memberFd.append("id_proof_back", idProofBack);

      // Installment rows with a real amount entered — the sole source of
      // truth for what actually gets recorded, replacing the old single
      // "Paid Amount" field.
      const validRows = showPartialPaymentFields
        ? membership.installmentRows.filter((r) => r.amount !== "" && Number(r.amount) > 0)
        : [];
      // When this subscription already had payment history before this edit
      // session (rows loaded pre-filled from the server), the subscription
      // PUT must not touch payment_type/paid_amount at all — every row,
      // including the first, is instead synced individually below so
      // existing rows are edited in place rather than overwritten wholesale.
      const bypassSubscriptionPayment = showPartialPaymentFields && hadExistingPayments;
      const firstRow = !hadExistingPayments ? validRows[0] : undefined;
      const rowsToSync = hadExistingPayments ? validRows : validRows.slice(1);

      const subscriptionPayload = {
        seat_id: membership.seat_id,
        membership_plan_id: membership.membership_plan_id ?? undefined,
        duration_months: membership.durationUnit === "month" ? Number(membership.durationCount) : undefined,
        duration_days: membership.durationUnit === "day" ? Number(membership.durationCount) : undefined,
        duration_unit: membership.durationUnit,
        start_date: membership.start_date,
        end_date: membership.end_date,
        amount: Number(membership.amount),
        // "pending" is sent explicitly (not stripped) on edit — it tells the
        // server to revert/clear any existing payment for this membership
        // cycle, not just "no change". On create, the store endpoint only
        // records a payment for the 4 real methods, so "pending" there is a
        // no-op either way. Omitted entirely when bypassing (see above).
        payment_type: bypassSubscriptionPayment ? undefined : membership.payment_type || undefined,
        // Only the first installment rides along on the subscription
        // create/update call (and only when there's no existing payment
        // history to preserve) — every other row is a separate Payment API
        // call below.
        paid_amount: firstRow ? Number(firstRow.amount) : undefined,
        paid_at: firstRow ? firstRow.paid_at : undefined,
      };

      const syncInstallmentRows = async (subscriptionId: number, forMemberId: number) => {
        const paymentMethod = membership.payment_type as PaymentMethod;
        for (const row of rowsToSync) {
          if (row.paymentId) {
            const changed = row.amount !== row.originalAmount || row.paid_at !== row.originalPaidAt;
            if (!changed) continue;
            await api.put(`/admin/payments/${row.paymentId}`, {
              amount: Number(row.amount),
              paid_at: row.paid_at,
              payment_method: paymentMethod,
            });
          } else {
            await api.post("/admin/payments", {
              member_id: forMemberId,
              member_subscription_id: subscriptionId,
              type: "subscription",
              amount: Number(row.amount),
              payment_method: paymentMethod,
              paid_at: row.paid_at,
              status: "paid",
            });
          }
        }
      };

      let member: Member;
      const activeSubscriptionId = editingMember?.active_subscription?.id;

      if (isEdit && memberId) {
        member = await api.put<Member>(`/admin/members/${memberId}`, memberFd);
        let subscriptionId = activeSubscriptionId;
        try {
          if (activeSubscriptionId) {
            await api.put(`/admin/subscriptions/${activeSubscriptionId}`, subscriptionPayload);
          } else {
            // No active subscription to update (e.g. member was inactive) — enroll them fresh.
            const createdSub = await api.post<MemberSubscription>("/admin/subscriptions", { member_id: member.id, ...subscriptionPayload });
            subscriptionId = createdSub.id;
          }
        } catch (subErr) {
          toast.error(
            subErr instanceof ApiError
              ? `Student updated, but seat/membership update failed: ${subErr.message}`
              : "Student updated, but seat/membership update failed."
          );
          invalidateMembers();
          onSaved();
          onClose();
          return;
        }
        if (rowsToSync.length > 0 && subscriptionId) {
          try {
            await syncInstallmentRows(subscriptionId, member.id);
            invalidatePayments();
          } catch (payErr) {
            toast.error(
              payErr instanceof ApiError
                ? `Student updated, but an installment failed to save: ${payErr.message}`
                : "Student updated, but an installment failed to save."
            );
            invalidateMembers();
            onSaved();
            onClose();
            return;
          }
        }
        toast.success("Student updated.");
      } else {
        member = await api.post<Member>("/admin/members", memberFd);
        let createdSub: MemberSubscription;
        try {
          createdSub = await api.post<MemberSubscription>("/admin/subscriptions", { member_id: member.id, ...subscriptionPayload });
        } catch (subErr) {
          toast.error(
            subErr instanceof ApiError
              ? `Member created, but seat/membership setup failed: ${subErr.message}`
              : "Member created, but seat/membership setup failed."
          );
          if (prefill?.leadId) await markLeadConverted(prefill.leadId, member.id);
          invalidateMembers();
          onSaved();
          onClose();
          return;
        }
        if (rowsToSync.length > 0) {
          try {
            await syncInstallmentRows(createdSub.id, member.id);
            invalidatePayments();
          } catch (payErr) {
            toast.error(
              payErr instanceof ApiError
                ? `Member created, but an installment failed to save: ${payErr.message}`
                : "Member created, but an installment failed to save."
            );
            if (prefill?.leadId) await markLeadConverted(prefill.leadId, member.id);
            invalidateMembers();
            onSaved();
            onClose();
            return;
          }
        }
        if (prefill?.leadId) await markLeadConverted(prefill.leadId, member.id);
        toast.success("Member added.");
      }

      invalidateMembers();
      onSaved();
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

  const meta = STEP_META[step - 1];
  const loadingInitialData = isEdit && memberLoading;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {loadingInitialData ? (
          <>
            <VisuallyHidden>
              <DialogTitle>Edit Member</DialogTitle>
            </VisuallyHidden>
            <div className="flex items-center justify-center py-16">
              <Icon icon="svg-spinners:180-ring" width={32} height={32} className="text-primary" />
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className={cn("h-11 w-11 shrink-0 rounded-xl flex items-center justify-center text-white", meta.tone)}>
                  <Icon icon={meta.icon} width={22} height={22} />
                </div>
                <div>
                  <DialogTitle className="text-base">{meta.label}</DialogTitle>
                  <p className="text-xs text-darklink">{meta.subtitle}</p>
                </div>
              </div>
              <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-lightsuccess px-3 py-1 text-xs font-semibold text-success">
                <Icon icon="solar:shield-check-bold" width={14} height={14} />
                STEP {step} OF 3
              </span>
            </DialogHeader>

            {step === 1 && (
              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="w-name">Full Name *</Label>
                  <Input id="w-name" value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} />
                  {fieldError("name") && <p className="text-xs text-error">{fieldError("name")}</p>}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="w-phone">Phone Number *</Label>
                  <PhoneInput id="w-phone" value={details.phone} onChange={(v) => setDetails({ ...details, phone: v })} required />
                  {fieldError("phone") && <p className="text-xs text-error">{fieldError("phone")}</p>}
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="w-whatsapp">WhatsApp Number (Optional)</Label>
                    <label className="flex items-center gap-1.5 text-xs text-darklink">
                      <input
                        type="checkbox"
                        checked={details.whatsappSameAsPhone}
                        onChange={(e) => setDetails({ ...details, whatsappSameAsPhone: e.target.checked })}
                      />
                      Same as phone number
                    </label>
                  </div>
                  {!details.whatsappSameAsPhone && (
                    <PhoneInput id="w-whatsapp" value={details.whatsapp} onChange={(v) => setDetails({ ...details, whatsapp: v })} />
                  )}
                  {details.whatsappSameAsPhone && (
                    <p className="text-xs text-darklink">We&apos;ll use the phone number above as the WhatsApp number.</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="w-email">Email (Optional)</Label>
                  <Input id="w-email" type="email" value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} />
                  {fieldError("email") && <p className="text-xs text-error">{fieldError("email")}</p>}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="w-address">Address (Optional)</Label>
                  <Textarea id="w-address" value={details.address} onChange={(e) => setDetails({ ...details, address: e.target.value })} rows={2} />
                  {fieldError("address") && <p className="text-xs text-error">{fieldError("address")}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="w-dob">Date of Birth (Optional)</Label>
                    <DatePicker value={details.date_of_birth} onChange={(v) => setDetails({ ...details, date_of_birth: v })} />
                    {fieldError("date_of_birth") && <p className="text-xs text-error">{fieldError("date_of_birth")}</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Gender (Optional)</Label>
                    <Select value={details.gender || "unset"} onValueChange={(v) => setDetails({ ...details, gender: v === "unset" ? "" : (v as MemberGender) })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unset">— Not specified —</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="w-idtype">ID Proof Type (Optional)</Label>
                    <Input id="w-idtype" placeholder="e.g. Aadhaar" value={details.id_proof_type} onChange={(e) => setDetails({ ...details, id_proof_type: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="w-idnumber">ID Proof Number (Optional)</Label>
                    <Input id="w-idnumber" value={details.id_proof_number} onChange={(e) => setDetails({ ...details, id_proof_number: e.target.value })} />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-5">
                <div className="rounded-2xl border border-success/30 bg-lightsuccess/60 dark:bg-success/10 p-4">
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-darklink">
                        <Icon icon="solar:calendar-linear" width={13} height={13} /> Start
                      </span>
                      <DatePicker
                        value={membership.start_date}
                        onChange={setStartDate}
                        className="border-none bg-transparent p-0 h-auto text-base font-bold text-dark dark:text-white justify-start hover:bg-transparent"
                      />
                    </div>
                    <Icon icon="solar:arrow-right-linear" width={18} height={18} className="text-success" />
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-darklink">
                        <Icon icon="solar:calendar-mark-linear" width={13} height={13} /> End
                      </span>
                      <DatePicker
                        value={membership.end_date}
                        onChange={(v) => setMembership((m) => ({ ...m, end_date: v }))}
                        disabled={membership.durationUnit !== "custom"}
                        className="border-none bg-transparent p-0 h-auto text-base font-bold text-dark dark:text-white justify-start hover:bg-transparent disabled:opacity-100"
                      />
                      {membership.durationUnit !== "custom" && (
                        <span className="w-fit rounded-full bg-lightsuccess px-2 py-0.5 text-[10px] font-bold text-success">AUTO</span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Duration *</Label>
                  <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-[1.4fr_1fr]">
                    <Select value={membership.durationUnit} onValueChange={(v) => setDurationUnit(v as DurationUnit)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATION_UNITS.map((u) => (
                          <SelectItem key={u.value} value={u.value}>
                            <span className="flex items-center gap-2">
                              <Icon icon={u.icon} width={16} height={16} />
                              {u.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {membership.durationUnit !== "custom" && (
                      <div className="relative">
                        <Input
                          type="number"
                          min="1"
                          value={membership.durationCount}
                          onChange={(e) => setDurationCount(e.target.value)}
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-darklink">
                          {membership.durationUnit === "day" ? "day" : "month"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {membershipPlans.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <Label>Membership Plan / Category (optional)</Label>
                    <Select
                      value={membership.membership_plan_id ? String(membership.membership_plan_id) : "none"}
                      onValueChange={(v) => {
                        if (v === "none") {
                          setMembership((m) => ({ ...m, membership_plan_id: null }));
                          return;
                        }
                        const plan = membershipPlans.find((p) => p.id === Number(v));
                        setMembership((m) => ({
                          ...m,
                          membership_plan_id: Number(v),
                          // Selecting a plan sets a sensible default fee — it
                          // stays editable afterward, never locked, so staff
                          // can still discount/adjust it per student.
                          amount: plan ? String(plan.price) : m.amount,
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No plan — custom fee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No plan — custom fee</SelectItem>
                        {membershipPlans.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.name} — ₹{p.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Total fee for this plan — always required at least once, so
                    the real amount owed is never lost (it's what drives Fee
                    Status everywhere: Dashboard, Statement, member list).
                    Once a fee has been entered, this box is hidden while
                    Payment Type is Pending — the value stays saved as-is, it
                    just isn't shown/editable in this mode. It reappears the
                    moment Payment Type is switched to an actual method, or
                    if no fee has been entered yet (still needed to set one). */}
                {!(membership.payment_type === "pending" && membership.amount) && (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="w-fees">Fees Amount (₹) *</Label>
                      <div className="relative">
                        <Icon icon="solar:rupee-linear" width={16} height={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-darklink" />
                        <Input
                          id="w-fees"
                          type="number"
                          min="0"
                          inputMode="decimal"
                          placeholder="e.g. 500"
                          className="pl-9"
                          value={membership.amount}
                          onChange={(e) => setMembership((m) => ({ ...m, amount: e.target.value }))}
                        />
                      </div>
                    </div>

                    {/* Partial payment: lets the initial collection be split into
                        installment rows instead of one lump sum. Only shown once
                        the "Partial Payment" toggle below is switched on — off by
                        default, so a real payment method alone no longer reveals
                        this field. */}
                    {showPartialPaymentFields && (
                      <div className="rounded-xl border border-border p-3 dark:border-darkborder">
                        <PaymentInstallmentsField
                          rows={membership.installmentRows}
                          onChange={(rows) => setMembership((m) => ({ ...m, installmentRows: rows }))}
                          onRemoveRow={(row) => {
                            if (row.paymentId) {
                              setRowDeleteTarget(row);
                            } else {
                              setMembership((m) => ({
                                ...m,
                                installmentRows: m.installmentRows.filter((r) => r.key !== row.key),
                              }));
                            }
                          }}
                          feesAmount={Number(membership.amount || 0)}
                        />
                        {installmentsError && <p className="mt-2 text-xs text-error">{installmentsError}</p>}
                        {!installmentsError && fieldError("paid_amount") && <p className="mt-2 text-xs text-error">{fieldError("paid_amount")}</p>}
                        {!installmentsError && installmentsPaidTotal > 0 && installmentsPaidTotal < Number(membership.amount || 0) && (
                          <p className="mt-2 text-xs text-warning">
                            Partial payment — ₹{(Number(membership.amount || 0) - installmentsPaidTotal).toLocaleString("en-IN")} will remain due.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Toggle for partial payment — defaults OFF. Only offered for a
                    real payment method (Pending has nothing collected yet). */}
                {isRealPayment && (
                  <button
                    type="button"
                    onClick={() =>
                      setMembership((m) => ({
                        ...m,
                        isPartialPayment: !m.isPartialPayment,
                        // Turning it off drops any unsaved rows; turning it on
                        // starts from a single empty row (today's date) unless
                        // rows are already there (e.g. re-toggling).
                        installmentRows: m.isPartialPayment
                          ? []
                          : m.installmentRows.length > 0
                            ? m.installmentRows
                            : [newInstallmentRow()],
                      }))
                    }
                    className="flex w-fit items-center gap-2 text-left"
                  >
                    <Icon
                      icon={membership.isPartialPayment ? "solar:check-square-bold" : "solar:square-linear"}
                      width={18}
                      height={18}
                      className={membership.isPartialPayment ? "text-primary" : "text-darklink"}
                    />
                    <span className="text-sm font-medium text-dark dark:text-white">Partial Payment</span>
                    <span className="text-xs text-darklink">(received part of the fee now)</span>
                  </button>
                )}

                <div className="flex flex-col gap-2">
                  <Label>Payment Type *</Label>
                  <Select
                    value={membership.payment_type}
                    onValueChange={(v) =>
                      setMembership((m) => ({
                        ...m,
                        payment_type: v as PaymentTypeChoice,
                        // Switching to "Pending" turns off the Partial Payment
                        // toggle and clears the rows — there's nothing paid yet
                        // in that state.
                        isPartialPayment: v === "pending" ? false : m.isPartialPayment,
                        installmentRows: v === "pending" ? [] : m.installmentRows,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="— Select payment type —" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Assign Seat *</Label>
                  <button
                    type="button"
                    onClick={() => setSeatModalOpen(true)}
                    className="flex items-center gap-3 rounded-xl border border-border bg-lightprimary/40 p-3.5 text-left transition-colors hover:border-primary/40 dark:border-darkborder dark:bg-white/5"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white shrink-0">
                      <Icon icon="solar:armchair-2-bold" width={20} height={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-dark dark:text-white">
                        {selectedSeat ? `Seat ${selectedSeat.seat_number}` : "Choose a seat"}
                      </p>
                      <p className="text-xs text-darklink">
                        {selectedSeat ? `${selectedSeat.category === "regular" ? "Regular" : "Rotation"} seat` : "Select a Regular or Rotation seat"}
                      </p>
                    </div>
                    <Icon icon="solar:alt-arrow-right-linear" width={18} height={18} className="text-darklink" />
                  </button>
                  {fieldError("seat_id") && <p className="text-xs text-error">{fieldError("seat_id")}</p>}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label>Student Photo (Optional)</Label>
                  <ImageUploadField
                    value={photo}
                    onChange={setPhoto}
                    existingUrl={existingPhotoUrl}
                    maxSizeMb={uploadLimits.maxSizeMb}
                    acceptedExtensions={uploadLimits.acceptedExtensions}
                  />
                  <p className="text-xs text-darklink">
                    {uploadLimits.acceptedExtensions.join(", ").toUpperCase()} — max {uploadLimits.maxSizeMb}MB.
                  </p>
                  {fieldError("photo") && <p className="text-xs text-error">{fieldError("photo")}</p>}
                </div>
                <div className="flex flex-col gap-2">
                  <Label>ID Proof — Front Side (Optional)</Label>
                  <FileUploadField
                    value={idProofFront}
                    onChange={setIdProofFront}
                    existingUrl={editingMember?.id_proof_front_url}
                    accept=".jpg,.jpeg,.png,.webp,.svg"
                    maxSizeMb={4}
                  />
                  {fieldError("id_proof_front") && <p className="text-xs text-error">{fieldError("id_proof_front")}</p>}
                </div>
                <div className="flex flex-col gap-2">
                  <Label>ID Proof — Back Side (Optional)</Label>
                  <FileUploadField
                    value={idProofBack}
                    onChange={setIdProofBack}
                    existingUrl={editingMember?.id_proof_back_url}
                    accept=".jpg,.jpeg,.png,.webp,.svg"
                    maxSizeMb={4}
                  />
                  {fieldError("id_proof_back") && <p className="text-xs text-error">{fieldError("id_proof_back")}</p>}
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="w-notes">Notes (Optional)</Label>
                  <Textarea
                    id="w-notes"
                    placeholder="Any additional notes about this student..."
                    value={details.notes}
                    onChange={(e) => setDetails({ ...details, notes: e.target.value })}
                    rows={3}
                  />
                  {fieldError("notes") && <p className="text-xs text-error">{fieldError("notes")}</p>}
                </div>
              </div>
            )}

            <DialogFooter className="mt-2 flex gap-2">
              {step > 1 && (
                <Button type="button" variant="outline" className="rounded-md flex items-center gap-1.5" onClick={() => setStep((s) => s - 1)}>
                  <Icon icon="solar:arrow-left-linear" width={16} height={16} />
                  Back
                </Button>
              )}
              <div className="flex-1" />
              {step < 3 ? (
                <Button
                  type="button"
                  className="rounded-md flex items-center gap-1.5"
                  onClick={() => setStep((s) => s + 1)}
                  disabled={step === 1 ? !canGoStep2 : !canSubmit}
                >
                  Next
                  <Icon icon="solar:arrow-right-linear" width={16} height={16} />
                </Button>
              ) : (
                <Button type="button" className="rounded-md flex items-center gap-1.5" onClick={handleSubmit} disabled={saving || !canSubmit}>
                  {saving ? (
                    <>
                      <Icon icon="svg-spinners:180-ring" width={16} height={16} />
                      {isEdit ? "Saving..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <Icon icon="solar:check-circle-bold" width={16} height={16} />
                      {isEdit ? "Save Changes" : "Create Member"}
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>

      <SelectSeatModal
        open={seatModalOpen}
        onClose={() => setSeatModalOpen(false)}
        seats={seats ?? []}
        seatsLoading={seatsLoading}
        selectedId={membership.seat_id}
        onConfirm={(id) => {
          setMembership((m) => ({ ...m, seat_id: id }));
          setSeatModalOpen(false);
        }}
      />

      <DeleteConfirmDialog
        open={!!rowDeleteTarget}
        title="Remove this installment?"
        description="This payment record will be permanently deleted."
        loading={rowDeleting}
        onCancel={() => setRowDeleteTarget(null)}
        onConfirm={confirmRemoveInstallmentRow}
      />
    </Dialog>
  );
}

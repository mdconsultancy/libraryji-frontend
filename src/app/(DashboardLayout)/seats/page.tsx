"use client";

import { useState, FormEvent } from "react";
import BreadcrumbComp from "@/app/(DashboardLayout)/layout/shared/breadcrumb/BreadcrumbComp";
import CardBox from "@/app/components/shared/CardBox";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Icon } from "@iconify/react";
import DeleteConfirmDialog from "@/components/shared/DeleteConfirmDialog";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { usePlanLimit } from "@/hooks/usePlanLimit";
import PlanLimitBanner from "@/components/shared/PlanLimitBanner";
import { useToast } from "@/context/ToastContext";
import { useHallOptions } from "@/hooks/useOptions";
import type { Seat, SeatType, SeatCategory, SeatStatus } from "@/types";

const BCrumb = [{ to: "/", title: "Home" }, { title: "Seats" }];

const seatTypes: SeatType[] = ["general", "ac", "non_ac", "cabin", "premium"];
const seatCategories: { label: string; value: SeatCategory }[] = [
  { label: "Regular — fixed to one member", value: "regular" },
  { label: "Rotation — shared across shifts", value: "rotation" },
];
const seatStatuses: SeatStatus[] = ["available", "occupied", "reserved", "maintenance"];

// 3D "pressed button" card: a darker slab sits behind the face and peeks out
// bottom-right; hovering lifts the face toward the slab's edge.
const seatCardStyles: Record<SeatStatus, { face: string; slab: string }> = {
  available: { face: "from-emerald-400 to-emerald-600", slab: "bg-emerald-800" },
  occupied: { face: "from-rose-400 to-rose-600", slab: "bg-rose-800" },
  reserved: { face: "from-amber-400 to-amber-600", slab: "bg-amber-800" },
  maintenance: { face: "from-slate-400 to-slate-600", slab: "bg-slate-800" },
};

const emptyForm = {
  hall_id: "",
  seat_number: "",
  seat_type: "general" as SeatType,
  category: "regular" as SeatCategory,
  status: "available" as SeatStatus,
};
const emptyBulkForm = { hall_id: "", prefix: "", start: "1", end: "10", seat_type: "general" as SeatType, category: "regular" as SeatCategory };

export default function SeatsPage() {
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const halls = useHallOptions();

  const { data: seatsData, isLoading: loading, error: loadError, mutate } = useApi<Seat[]>("/admin/seats", {
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const seats = seatsData ?? [];
  const error = loadError ? "Unable to load seats." : null;
  const { limit: seatLimit, used: seatsUsed, exceeded: seatLimitExceeded, refresh: refreshSeatLimit } = usePlanLimit("seats");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Seat | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [bulkForm, setBulkForm] = useState(emptyBulkForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Seat | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFieldErrors({});
    setDialogOpen(true);
  };

  const openEdit = (seat: Seat) => {
    setEditing(seat);
    setForm({
      hall_id: seat.hall_id ? String(seat.hall_id) : "",
      seat_number: seat.seat_number,
      seat_type: seat.seat_type,
      category: seat.category,
      status: seat.status,
    });
    setFieldErrors({});
    setDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    try {
      if (editing) {
        await api.put(`/admin/seats/${editing.id}`, {
          hall_id: form.hall_id ? Number(form.hall_id) : null,
          seat_number: form.seat_number,
          seat_type: form.seat_type,
          category: form.category,
          status: form.status,
        });
      } else {
        await api.post("/admin/seats", {
          hall_id: form.hall_id ? Number(form.hall_id) : null,
          seat_number: form.seat_number,
          seat_type: form.seat_type,
          category: form.category,
          status: form.status,
        });
        refreshSeatLimit();
      }
      setDialogOpen(false);
      mutate();
    } catch (err) {
      if (err instanceof ApiError) setFieldErrors(err.errors || {});
    } finally {
      setSaving(false);
    }
  };

  const handleBulkSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    try {
      await api.post("/admin/seats/bulk", {
        hall_id: bulkForm.hall_id ? Number(bulkForm.hall_id) : null,
        prefix: bulkForm.prefix || undefined,
        start: Number(bulkForm.start),
        end: Number(bulkForm.end),
        seat_type: bulkForm.seat_type,
        category: bulkForm.category,
      });
      setBulkDialogOpen(false);
      setBulkForm(emptyBulkForm);
      mutate();
      refreshSeatLimit();
    } catch (err) {
      if (err instanceof ApiError) setFieldErrors(err.errors || {});
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/seats/${deleteTarget.id}`);
      setDeleteTarget(null);
      mutate();
      refreshSeatLimit();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to delete seat. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const fieldError = (field: string) => fieldErrors[field]?.[0];

  return (
    <>
      <BreadcrumbComp title="Seats" items={BCrumb} />

      <CardBox className="p-0 bg-background overflow-hidden border-none rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="flex flex-wrap gap-3">
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {seatStatuses.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setBulkDialogOpen(true)}
              className="flex items-center gap-1.5"
              disabled={seatLimitExceeded}
              title={seatLimitExceeded ? "Seat limit reached — upgrade your plan to add more." : undefined}
            >
              <Icon icon="solar:widget-add-linear" width={18} height={18} />
              Bulk Create
            </Button>
            <Button
              onClick={openCreate}
              className="flex items-center gap-1.5"
              disabled={seatLimitExceeded}
              title={seatLimitExceeded ? "Seat limit reached — upgrade your plan to add more." : undefined}
            >
              <Icon icon="solar:add-circle-linear" width={18} height={18} />
              Add Seat
            </Button>
          </div>
        </div>

        {seatLimitExceeded && seatLimit !== null && (
          <div className="px-6">
            <PlanLimitBanner resource="Seats" limit={seatLimit} used={seatsUsed} />
          </div>
        )}

        {error && <p className="px-6 pb-4 text-sm text-error">{error}</p>}

        <div className="flex flex-wrap items-center gap-4 px-6 pb-4 text-xs">
          {seatStatuses.map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-br ${seatCardStyles[s].face}`} />
              <span className="capitalize text-gray-500 dark:text-gray-400">{s}</span>
            </div>
          ))}
        </div>

        <div className="px-6 pb-6">
          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-2xl bg-gray-100 dark:bg-darkgray" />
              ))}
            </div>
          ) : seats.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No seats found</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {seats.map((seat) => {
                const styles = seatCardStyles[seat.status];
                const occupant = seat.current_subscription?.member?.name;

                return (
                  <div key={seat.id} className="group relative">
                    {/* Slab: peeks out bottom-right to fake depth */}
                    <div className={`absolute inset-0 top-1.5 left-1.5 rounded-2xl ${styles.slab}`} />

                    {/* Face */}
                    <button
                      type="button"
                      onClick={() => openEdit(seat)}
                      title={occupant ? `${seat.seat_number} • ${occupant}` : seat.seat_number}
                      className={`relative flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-2xl border border-white/20 bg-gradient-to-br ${styles.face} p-2 text-white shadow-lg transition-transform duration-150 ease-out group-hover:-translate-y-1 group-active:translate-y-0.5`}
                    >
                      <Icon icon="mdi:seat" width={26} height={26} className="drop-shadow" />
                      <span className="text-sm font-bold leading-none">{seat.seat_number}</span>
                      <span className="text-[9px] uppercase tracking-wide opacity-90 leading-none">
                        {seat.seat_type.replace("_", " ")}
                      </span>
                      {occupant && (
                        <span className="w-full truncate text-center text-[9px] opacity-85 leading-none">{occupant}</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(seat);
                      }}
                      className="absolute -right-1.5 -top-1.5 hidden h-6 w-6 items-center justify-center rounded-full bg-white text-error shadow-md group-hover:flex dark:bg-dark"
                    >
                      <Icon icon="solar:trash-bin-trash-linear" width={14} height={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardBox>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Seat" : "Add Seat"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Hall (optional)</Label>
              <Select value={form.hall_id || "none"} onValueChange={(v) => setForm({ ...form, hall_id: v === "none" ? "" : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="No hall" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No hall</SelectItem>
                  {halls.map((h) => (
                    <SelectItem key={h.id} value={String(h.id)}>{h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="seat_number">Seat Number</Label>
              <Input id="seat_number" value={form.seat_number} onChange={(e) => setForm({ ...form, seat_number: e.target.value })} required />
              {fieldError("seat_number") && <p className="text-xs text-error">{fieldError("seat_number")}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label>Seat Type</Label>
              <Select value={form.seat_type} onValueChange={(v) => setForm({ ...form, seat_type: v as SeatType })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {seatTypes.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">{t.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as SeatCategory })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {seatCategories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as SeatStatus })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {seatStatuses.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="flex gap-2 mt-4">
              <Button type="submit" className="rounded-md" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button type="button" variant="outline" className="rounded-md" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Bulk Create Seats</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleBulkSubmit} className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Hall (optional)</Label>
              <Select value={bulkForm.hall_id || "none"} onValueChange={(v) => setBulkForm({ ...bulkForm, hall_id: v === "none" ? "" : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="No hall" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No hall</SelectItem>
                  {halls.map((h) => (
                    <SelectItem key={h.id} value={String(h.id)}>{h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="prefix">Prefix (optional)</Label>
              <Input id="prefix" placeholder="e.g. A-" value={bulkForm.prefix} onChange={(e) => setBulkForm({ ...bulkForm, prefix: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="start">Start</Label>
                <Input id="start" type="number" min={1} value={bulkForm.start} onChange={(e) => setBulkForm({ ...bulkForm, start: e.target.value })} required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="end">End</Label>
                <Input id="end" type="number" min={1} value={bulkForm.end} onChange={(e) => setBulkForm({ ...bulkForm, end: e.target.value })} required />
              </div>
            </div>
            {fieldError("end") && <p className="text-xs text-error">{fieldError("end")}</p>}
            <div className="flex flex-col gap-2">
              <Label>Seat Type</Label>
              <Select value={bulkForm.seat_type} onValueChange={(v) => setBulkForm({ ...bulkForm, seat_type: v as SeatType })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {seatTypes.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">{t.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Category</Label>
              <Select value={bulkForm.category} onValueChange={(v) => setBulkForm({ ...bulkForm, category: v as SeatCategory })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {seatCategories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="flex gap-2 mt-4">
              <Button type="submit" className="rounded-md" disabled={saving}>
                {saving ? "Creating..." : "Create Seats"}
              </Button>
              <Button type="button" variant="outline" className="rounded-md" onClick={() => setBulkDialogOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        title={`Delete seat "${deleteTarget?.seat_number}"?`}
        description="This will permanently remove the seat."
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}

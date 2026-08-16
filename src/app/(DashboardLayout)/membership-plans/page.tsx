"use client";

import { useState, FormEvent } from "react";
import BreadcrumbComp from "@/app/(DashboardLayout)/layout/shared/breadcrumb/BreadcrumbComp";
import CardBox from "@/app/components/shared/CardBox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@iconify/react";
import DeleteConfirmDialog from "@/components/shared/DeleteConfirmDialog";
import TableSkeleton from "@/components/shared/TableSkeleton";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/context/ToastContext";
import { useShiftOptions } from "@/hooks/useOptions";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import type { MembershipPlan, SeatType } from "@/types";

const BCrumb = [{ to: "/", title: "Home" }, { title: "Membership Plans" }];

const seatTypes: SeatType[] = ["general", "ac", "non_ac", "cabin", "premium"];

const emptyForm = {
  shift_id: "",
  name: "",
  description: "",
  duration_days: "30",
  price: "",
  seat_type: "",
  fixed_seat: false,
  status: "active" as "active" | "inactive",
};

export default function MembershipPlansPage() {
  // Removed from the product entirely — no role can reach this page,
  // enforced here and server-side (routes/api.php returns 403 for all
  // methods now, not just write actions).
  const { authorized } = useRoleGuard([]);
  const toast = useToast();
  const shifts = useShiftOptions();
  const { data: plansData, isLoading: loading, error: loadError, mutate } = useApi<MembershipPlan[]>("/admin/membership-plans");
  const plans = plansData ?? [];
  const error = loadError ? "Unable to load membership plans." : null;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MembershipPlan | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<MembershipPlan | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFieldErrors({});
    setDialogOpen(true);
  };

  const openEdit = (plan: MembershipPlan) => {
    setEditing(plan);
    setForm({
      shift_id: plan.shift_id ? String(plan.shift_id) : "",
      name: plan.name,
      description: plan.description || "",
      duration_days: String(plan.duration_days),
      price: String(plan.price),
      seat_type: plan.seat_type || "",
      fixed_seat: plan.fixed_seat,
      status: plan.status,
    });
    setFieldErrors({});
    setDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    try {
      const payload = {
        shift_id: form.shift_id ? Number(form.shift_id) : null,
        name: form.name,
        description: form.description || null,
        duration_days: Number(form.duration_days),
        price: Number(form.price),
        seat_type: form.seat_type || null,
        fixed_seat: form.fixed_seat,
        status: form.status,
      };
      if (editing) {
        await api.put(`/admin/membership-plans/${editing.id}`, payload);
      } else {
        await api.post("/admin/membership-plans", payload);
      }
      setDialogOpen(false);
      mutate();
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
      await api.delete(`/admin/membership-plans/${deleteTarget.id}`);
      setDeleteTarget(null);
      mutate();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to delete membership plan. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const fieldError = (field: string) => fieldErrors[field]?.[0];

  if (!authorized) return null;

  return (
    <>
      <BreadcrumbComp title="Membership Plans" items={BCrumb} />

      {/* Desktop (xl and up) — unchanged */}
      <div className="hidden xl:block">
      <CardBox className="p-0 bg-background overflow-hidden border-none rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center justify-end gap-4 p-6">
          <Button onClick={openCreate} className="flex items-center gap-1.5">
            <Icon icon="solar:add-circle-linear" width={18} height={18} />
            Add Plan
          </Button>
        </div>

        {error && <p className="px-6 pb-4 text-sm text-error">{error}</p>}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-6">Name</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Seat Type</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pe-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton columns={7} />
              ) : plans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-sm text-gray-500">No membership plans found</TableCell>
                </TableRow>
              ) : (
                plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="ps-6 font-medium">{plan.name}</TableCell>
                    <TableCell>{plan.duration_days} days</TableCell>
                    <TableCell>₹{Number(plan.price).toLocaleString()}</TableCell>
                    <TableCell className="capitalize">{plan.seat_type?.replace('_', ' ') || "Any"}</TableCell>
                    <TableCell>{plan.shift?.name || "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`border-none capitalize ${plan.status === "active" ? "bg-lightsuccess text-success" : "bg-lighterror text-error"}`}
                      >
                        {plan.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pe-6">
                      <div className="flex justify-end gap-2">
                        <Button variant="lightprimary" size="sm" onClick={() => openEdit(plan)}>
                          <Icon icon="ic:outline-edit" width={16} height={16} />
                        </Button>
                        <Button
                          variant="lighterror"
                          size="sm"
                          onClick={() => setDeleteTarget(plan)}
                        >
                          <Icon icon="solar:trash-bin-trash-linear" width={16} height={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardBox>
      </div>

      {/* Mobile (below xl) — same card-list pattern as Members/Students */}
      <div className="xl:hidden flex flex-col gap-4">
        <div className="rounded-2xl bg-white dark:bg-darkgray p-4 shadow-xs flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-lightprimary flex items-center justify-center shrink-0">
            <Icon icon="solar:document-text-bold-duotone" width={22} height={22} className="text-primary" />
          </div>
          <div>
            <p className="text-xs text-darklink">Total Plans</p>
            <p className="text-xl font-bold text-dark dark:text-white">{plans.length}</p>
          </div>
        </div>

        <Button onClick={openCreate} className="w-full flex items-center justify-center gap-1.5">
          <Icon icon="solar:add-circle-linear" width={18} height={18} />
          Add Plan
        </Button>

        {error && <p className="text-sm text-error">{error}</p>}

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-gray-100 dark:bg-darkgray animate-pulse" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <p className="text-center py-8 text-sm text-gray-500">No membership plans found</p>
        ) : (
          <div className="flex flex-col gap-3">
            {plans.map((plan) => (
              <div key={plan.id} className="rounded-2xl bg-white dark:bg-darkgray p-4 shadow-xs flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-lightprimary flex items-center justify-center shrink-0">
                  <Icon icon="solar:document-text-bold-duotone" width={22} height={22} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-dark dark:text-white truncate">{plan.name}</p>
                  <p className="text-xs text-darklink truncate">{plan.duration_days} days · ₹{Number(plan.price).toLocaleString()}</p>
                  <p className="text-xs text-darklink capitalize mt-0.5">{plan.seat_type?.replace('_', ' ') || "Any seat"}{plan.shift ? ` · ${plan.shift.name}` : ""}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge
                    variant="secondary"
                    className={`border-none capitalize ${plan.status === "active" ? "bg-lightsuccess text-success" : "bg-lighterror text-error"}`}
                  >
                    {plan.status}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" aria-label="Plan actions" className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-lightprimary hover:text-primary">
                        <Icon icon="tabler:dots-vertical" width={18} height={18} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(plan)}>
                        <Icon icon="ic:outline-edit" width={16} height={16} className="mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeleteTarget(plan)} className="text-error">
                        <Icon icon="solar:trash-bin-trash-linear" width={16} height={16} className="mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Plan" : "Add Plan"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="flex flex-col gap-2 xl:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              {fieldError("name") && <p className="text-xs text-error">{fieldError("name")}</p>}
            </div>
            <div className="flex flex-col gap-2 xl:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="duration_days">Duration (days)</Label>
              <Input id="duration_days" type="number" min={1} value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} required />
              {fieldError("duration_days") && <p className="text-xs text-error">{fieldError("duration_days")}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="price">Price</Label>
              <Input id="price" type="number" min={0} step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              {fieldError("price") && <p className="text-xs text-error">{fieldError("price")}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label>Seat Type (optional)</Label>
              <Select value={form.seat_type || "any"} onValueChange={(v) => setForm({ ...form, seat_type: v === "any" ? "" : v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  {seatTypes.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">{t.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Shift (optional)</Label>
              <Select value={form.shift_id || "none"} onValueChange={(v) => setForm({ ...form, shift_id: v === "none" ? "" : v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No shift</SelectItem>
                  {shifts.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="fixed_seat" checked={form.fixed_seat} onCheckedChange={(v) => setForm({ ...form, fixed_seat: v === true })} />
              <Label htmlFor="fixed_seat" className="font-normal">Fixed seat assignment</Label>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "active" | "inactive" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="xl:col-span-2 flex gap-2 mt-4">
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

      <DeleteConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This will permanently remove the plan."
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}

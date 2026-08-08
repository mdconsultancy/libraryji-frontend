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
import type { Shift } from "@/types";

const BCrumb = [{ to: "/", title: "Home" }, { title: "Shifts" }];

const emptyForm = { name: "", start_time: "", end_time: "", status: "active" as "active" | "inactive" };

export default function ShiftsPage() {
  const toast = useToast();
  const { data: shiftsData, isLoading: loading, error: loadError, mutate } = useApi<Shift[]>("/admin/shifts");
  const shifts = shiftsData ?? [];
  const error = loadError ? "Unable to load shifts." : null;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Shift | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Shift | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFieldErrors({});
    setDialogOpen(true);
  };

  const openEdit = (shift: Shift) => {
    setEditing(shift);
    setForm({ name: shift.name, start_time: shift.start_time.slice(0, 5), end_time: shift.end_time.slice(0, 5), status: shift.status });
    setFieldErrors({});
    setDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    try {
      if (editing) {
        await api.put(`/admin/shifts/${editing.id}`, form);
      } else {
        await api.post("/admin/shifts", form);
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
      await api.delete(`/admin/shifts/${deleteTarget.id}`);
      setDeleteTarget(null);
      mutate();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to delete shift. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const fieldError = (field: string) => fieldErrors[field]?.[0];

  return (
    <>
      <BreadcrumbComp title="Shifts" items={BCrumb} />

      {/* Desktop (xl and up) — unchanged */}
      <div className="hidden xl:block">
      <CardBox className="p-0 bg-background overflow-hidden border-none rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center justify-end gap-4 p-6">
          <Button onClick={openCreate} className="flex items-center gap-1.5">
            <Icon icon="solar:add-circle-linear" width={18} height={18} />
            Add Shift
          </Button>
        </div>

        {error && <p className="px-6 pb-4 text-sm text-error">{error}</p>}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-6">Name</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pe-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton columns={5} />
              ) : shifts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-sm text-gray-500">No shifts found</TableCell>
                </TableRow>
              ) : (
                shifts.map((shift) => (
                  <TableRow key={shift.id}>
                    <TableCell className="ps-6 font-medium">{shift.name}</TableCell>
                    <TableCell>{shift.start_time.slice(0, 5)}</TableCell>
                    <TableCell>{shift.end_time.slice(0, 5)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`border-none capitalize ${shift.status === "active" ? "bg-lightsuccess text-success" : "bg-lighterror text-error"}`}
                      >
                        {shift.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pe-6">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(shift)}>
                          <Icon icon="ic:outline-edit" width={16} height={16} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-error hover:bg-error hover:text-white"
                          onClick={() => setDeleteTarget(shift)}
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
            <Icon icon="solar:clock-circle-bold-duotone" width={22} height={22} className="text-primary" />
          </div>
          <div>
            <p className="text-xs text-darklink">Total Shifts</p>
            <p className="text-xl font-bold text-dark dark:text-white">{shifts.length}</p>
          </div>
        </div>

        <Button onClick={openCreate} className="w-full flex items-center justify-center gap-1.5">
          <Icon icon="solar:add-circle-linear" width={18} height={18} />
          Add Shift
        </Button>

        {error && <p className="text-sm text-error">{error}</p>}

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-gray-100 dark:bg-darkgray animate-pulse" />
            ))}
          </div>
        ) : shifts.length === 0 ? (
          <p className="text-center py-8 text-sm text-gray-500">No shifts found</p>
        ) : (
          <div className="flex flex-col gap-3">
            {shifts.map((shift) => (
              <div key={shift.id} className="rounded-2xl bg-white dark:bg-darkgray p-4 shadow-xs flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-lightprimary flex items-center justify-center shrink-0">
                  <Icon icon="solar:clock-circle-bold-duotone" width={22} height={22} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-dark dark:text-white truncate">{shift.name}</p>
                  <p className="text-xs text-darklink mt-0.5">{shift.start_time.slice(0, 5)} – {shift.end_time.slice(0, 5)}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge
                    variant="secondary"
                    className={`border-none capitalize ${shift.status === "active" ? "bg-lightsuccess text-success" : "bg-lighterror text-error"}`}
                  >
                    {shift.status}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" aria-label="Shift actions" className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-lightprimary hover:text-primary">
                        <Icon icon="tabler:dots-vertical" width={18} height={18} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(shift)}>
                        <Icon icon="ic:outline-edit" width={16} height={16} className="mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeleteTarget(shift)} className="text-error">
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Shift" : "Add Shift"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              {fieldError("name") && <p className="text-xs text-error">{fieldError("name")}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Input id="start_time" type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required />
                {fieldError("start_time") && <p className="text-xs text-error">{fieldError("start_time")}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input id="end_time" type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} required />
                {fieldError("end_time") && <p className="text-xs text-error">{fieldError("end_time")}</p>}
              </div>
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

      <DeleteConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This will permanently remove the shift."
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}

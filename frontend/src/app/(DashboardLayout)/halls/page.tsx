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
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { usePermissionGuard } from "@/hooks/usePermissionGuard";
import type { Hall } from "@/types";

const BCrumb = [{ to: "/", title: "Home" }, { title: "Halls" }];

const emptyForm = (tenantId: number | null) => ({
  name: "",
  description: "",
  status: "active" as "active" | "inactive",
  tenant_id: tenantId ? String(tenantId) : "",
});

export default function HallsPage() {
  const toast = useToast();
  const { user } = useAuth();
  const libraries = user?.tenants ?? [];
  const { authorized } = usePermissionGuard("halls", "view");
  const canAdd = usePermission("halls", "add");
  const canEdit = usePermission("halls", "edit");
  const canDelete = usePermission("halls", "delete");

  const { data: hallsData, isLoading: loading, error: loadError, mutate } = useApi<Hall[]>("/admin/halls");
  const halls = hallsData ?? [];
  const error = loadError ? "Unable to load halls." : null;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Hall | null>(null);
  const [form, setForm] = useState(emptyForm(user?.current_tenant_id ?? null));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Hall | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(user?.current_tenant_id ?? null));
    setFieldErrors({});
    setDialogOpen(true);
  };

  const openEdit = (hall: Hall) => {
    setEditing(hall);
    setForm({
      name: hall.name,
      description: hall.description || "",
      status: hall.status,
      tenant_id: String(hall.tenant_id),
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
        await api.put(`/admin/halls/${editing.id}`, { name: form.name, description: form.description, status: form.status });
      } else {
        await api.post("/admin/halls", { name: form.name, description: form.description, status: form.status, tenant_id: Number(form.tenant_id) });
        const targetLibrary = libraries.find((l) => l.id === Number(form.tenant_id));
        if (targetLibrary && targetLibrary.id !== user?.current_tenant_id) {
          toast.success(`Hall created in ${targetLibrary.name}. Switch to that library to manage it.`);
        }
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
      await api.delete(`/admin/halls/${deleteTarget.id}`);
      setDeleteTarget(null);
      mutate();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to delete hall. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const fieldError = (field: string) => fieldErrors[field]?.[0];

  if (!authorized) return null;

  return (
    <>
      <BreadcrumbComp title="Halls" items={BCrumb} />

      {/* Desktop (xl and up) — unchanged */}
      <div className="hidden xl:block">
      <CardBox className="p-0 bg-background overflow-hidden border-none rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center justify-end gap-4 p-6">
          {canAdd && (
            <Button onClick={openCreate} className="flex items-center gap-1.5">
              <Icon icon="solar:add-circle-linear" width={18} height={18} />
              Add Hall
            </Button>
          )}
        </div>

        {error && <p className="px-6 pb-4 text-sm text-error">{error}</p>}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-6">Name</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pe-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton columns={4} />
              ) : halls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-sm text-gray-500">No halls found</TableCell>
                </TableRow>
              ) : (
                halls.map((hall) => (
                  <TableRow key={hall.id}>
                    <TableCell className="ps-6 font-medium">{hall.name}</TableCell>
                    <TableCell>{hall.seats_count ?? 0}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`border-none capitalize ${hall.status === "active" ? "bg-lightsuccess text-success" : "bg-lighterror text-error"}`}
                      >
                        {hall.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pe-6">
                      <div className="flex justify-end gap-2">
                        {canEdit && (
                          <Button variant="outline" size="sm" onClick={() => openEdit(hall)}>
                            <Icon icon="ic:outline-edit" width={16} height={16} />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-error hover:bg-error hover:text-white"
                            onClick={() => setDeleteTarget(hall)}
                          >
                            <Icon icon="solar:trash-bin-trash-linear" width={16} height={16} />
                          </Button>
                        )}
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
            <Icon icon="solar:home-2-bold-duotone" width={22} height={22} className="text-primary" />
          </div>
          <div>
            <p className="text-xs text-darklink">Total Halls</p>
            <p className="text-xl font-bold text-dark dark:text-white">{halls.length}</p>
          </div>
        </div>

        {canAdd && (
          <Button onClick={openCreate} className="w-full flex items-center justify-center gap-1.5">
            <Icon icon="solar:add-circle-linear" width={18} height={18} />
            Add Hall
          </Button>
        )}

        {error && <p className="text-sm text-error">{error}</p>}

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-gray-100 dark:bg-darkgray animate-pulse" />
            ))}
          </div>
        ) : halls.length === 0 ? (
          <p className="text-center py-8 text-sm text-gray-500">No halls found</p>
        ) : (
          <div className="flex flex-col gap-3">
            {halls.map((hall) => (
              <div key={hall.id} className="rounded-2xl bg-white dark:bg-darkgray p-4 shadow-xs flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-lightprimary flex items-center justify-center shrink-0">
                  <Icon icon="solar:home-2-bold-duotone" width={22} height={22} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-dark dark:text-white truncate">{hall.name}</p>
                  <p className="text-xs text-darklink mt-0.5">{hall.seats_count ?? 0} seats</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge
                    variant="secondary"
                    className={`border-none capitalize ${hall.status === "active" ? "bg-lightsuccess text-success" : "bg-lighterror text-error"}`}
                  >
                    {hall.status}
                  </Badge>
                  {(canEdit || canDelete) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button type="button" aria-label="Hall actions" className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-lightprimary hover:text-primary">
                          <Icon icon="tabler:dots-vertical" width={18} height={18} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canEdit && (
                          <DropdownMenuItem onClick={() => openEdit(hall)}>
                            <Icon icon="ic:outline-edit" width={16} height={16} className="mr-2" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {canDelete && (
                          <DropdownMenuItem onClick={() => setDeleteTarget(hall)} className="text-error">
                            <Icon icon="solar:trash-bin-trash-linear" width={16} height={16} className="mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Hall" : "Add Hall"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
            {!editing && (
              <div className="flex flex-col gap-2">
                <Label>Library</Label>
                <Select
                  value={form.tenant_id}
                  onValueChange={(v) => setForm({ ...form, tenant_id: v })}
                  disabled={libraries.length <= 1}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select library" />
                  </SelectTrigger>
                  <SelectContent>
                    {libraries.map((lib) => (
                      <SelectItem key={lib.id} value={String(lib.id)}>{lib.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldError("tenant_id") && <p className="text-xs text-error">{fieldError("tenant_id")}</p>}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              {fieldError("name") && <p className="text-xs text-error">{fieldError("name")}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "active" | "inactive" })}>
                <SelectTrigger id="status">
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
        description="This will permanently remove the hall."
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}

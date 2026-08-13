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
import PasswordInput from "@/components/form/PasswordInput";
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
import { Icon } from "@iconify/react";
import PaginationBar from "@/components/shared/Pagination";
import TableSkeleton from "@/components/shared/TableSkeleton";
import DeleteConfirmDialog from "@/components/shared/DeleteConfirmDialog";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/context/ToastContext";
import type { Tenant, TenantStatus, SubscriptionPlan, Paginated } from "@/types";

const BCrumb = [{ to: "/", title: "Home" }, { title: "Tenants" }];

const statuses: TenantStatus[] = ["trial", "active", "suspended", "cancelled"];

const statusStyles: Record<TenantStatus, string> = {
  trial: "bg-lightwarning text-warning",
  active: "bg-lightsuccess text-success",
  suspended: "bg-lighterror text-error",
  cancelled: "bg-lightsecondary text-secondary",
};

const emptyCreateForm = {
  library_name: "",
  admin_name: "",
  email: "",
  phone: "",
  password: "",
  subscription_plan_id: "",
  status: "active" as TenantStatus,
  trial_days: "14",
};
const emptyEditForm = { name: "", email: "", phone: "", timezone: "", status: "active" as TenantStatus, trial_ends_at: "" };

function addDays(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function daysUntil(date: string): number {
  const ms = new Date(date).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export default function TenantsPage() {
  const toast = useToast();
  const [regeneratingId, setRegeneratingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data: plansData } = useApi<SubscriptionPlan[]>("/super-admin/subscription-plans");
  const plans = plansData ?? [];

  const { data: tenants, isLoading: loading, error: loadError, mutate } = useApi<Paginated<Tenant>>("/super-admin/tenants", {
    page,
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const error = loadError ? "Unable to load tenants." : null;

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [createErrors, setCreateErrors] = useState<Record<string, string[]>>({});

  const [editing, setEditing] = useState<Tenant | null>(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editErrors, setEditErrors] = useState<Record<string, string[]>>({});

  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Tenant | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actioningId, setActioningId] = useState<number | null>(null);

  const openCreate = () => {
    setCreateForm(emptyCreateForm);
    setCreateErrors({});
    setCreateOpen(true);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setCreateErrors({});
    try {
      await api.post("/super-admin/tenants", {
        library_name: createForm.library_name,
        admin_name: createForm.admin_name,
        email: createForm.email,
        phone: createForm.phone || undefined,
        password: createForm.password,
        subscription_plan_id: createForm.subscription_plan_id ? Number(createForm.subscription_plan_id) : undefined,
        status: createForm.status,
        trial_days: createForm.status === "trial" ? Number(createForm.trial_days) || 14 : undefined,
      });
      setCreateOpen(false);
      mutate();
    } catch (err) {
      if (err instanceof ApiError) setCreateErrors(err.errors || {});
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (tenant: Tenant) => {
    setEditing(tenant);
    setEditForm({
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone || "",
      timezone: tenant.timezone || "",
      status: tenant.status,
      trial_ends_at: tenant.trial_ends_at ? tenant.trial_ends_at.slice(0, 10) : "",
    });
    setEditErrors({});
  };

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setEditErrors({});
    try {
      await api.put(`/super-admin/tenants/${editing.id}`, {
        ...editForm,
        trial_ends_at: editForm.status === "trial" ? editForm.trial_ends_at || undefined : undefined,
      });
      setEditing(null);
      mutate();
    } catch (err) {
      if (err instanceof ApiError) setEditErrors(err.errors || {});
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (tenant: Tenant) => {
    setActioningId(tenant.id);
    try {
      const endpoint = tenant.status === "suspended" ? "activate" : "suspend";
      await api.post(`/super-admin/tenants/${tenant.id}/${endpoint}`);
      mutate();
    } finally {
      setActioningId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/super-admin/tenants/${deleteTarget.id}`);
      setDeleteTarget(null);
      mutate();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to delete tenant. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    toast.success(`Library Code "${code}" copied to clipboard.`);
  };

  const handleRegenerateCode = async (tenant: Tenant) => {
    setRegeneratingId(tenant.id);
    try {
      const res = await api.post<{ tenant: Tenant }>(`/super-admin/tenants/${tenant.id}/regenerate-code`);
      toast.success(`New Library Code: ${res.tenant.library_code}`);
      mutate();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    } finally {
      setRegeneratingId(null);
    }
  };

  const fieldError = (errs: Record<string, string[]>, field: string) => errs[field]?.[0];

  return (
    <>
      <BreadcrumbComp title="Tenants" items={BCrumb} />

      <CardBox className="p-0 bg-background overflow-hidden border-none rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="flex flex-wrap gap-3">
            <div className="relative w-full sm:w-64">
              <Icon icon="solar:magnifer-linear" width={18} height={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-darklink" />
              <Input placeholder="Search by name or library code..." className="pl-10" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <div className="w-full sm:w-44">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={openCreate} className="flex items-center gap-1.5">
            <Icon icon="solar:add-circle-linear" width={18} height={18} />
            Add Tenant
          </Button>
        </div>

        {error && <p className="px-6 pb-4 text-sm text-error">{error}</p>}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-6">Library</TableHead>
                <TableHead>Library Code</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Halls</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pe-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton columns={8} />
              ) : tenants?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-sm text-gray-500">No tenants found</TableCell>
                </TableRow>
              ) : (
                tenants?.data.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="ps-6 font-medium">{tenant.name}</TableCell>
                    <TableCell>
                      {tenant.library_code ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-semibold tracking-wider bg-lightprimary text-primary px-2 py-0.5 rounded">
                            {tenant.library_code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(tenant.library_code!)}
                            className="text-darklink hover:text-primary"
                            aria-label="Copy library code"
                          >
                            <Icon icon="tabler:copy" width={16} height={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRegenerateCode(tenant)}
                            disabled={regeneratingId === tenant.id}
                            className="text-darklink hover:text-primary"
                            aria-label="Regenerate library code"
                          >
                            <Icon icon="tabler:refresh" width={16} height={16} className={regeneratingId === tenant.id ? "animate-spin" : ""} />
                          </button>
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{tenant.email}</TableCell>
                    <TableCell>{tenant.active_subscription?.plan?.name || "—"}</TableCell>
                    <TableCell>{tenant.halls_count ?? 0}</TableCell>
                    <TableCell>{tenant.members_count ?? 0}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`border-none capitalize ${statusStyles[tenant.status]}`}>
                        {tenant.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pe-6">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actioningId === tenant.id}
                          onClick={() => handleToggleStatus(tenant)}
                        >
                          <Icon icon={tenant.status === "suspended" ? "solar:play-circle-linear" : "solar:pause-circle-linear"} width={16} height={16} />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEdit(tenant)}>
                          <Icon icon="ic:outline-edit" width={16} height={16} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-error hover:bg-error hover:text-white"
                          onClick={() => setDeleteTarget(tenant)}
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

        <PaginationBar meta={tenants ?? null} onPageChange={setPage} />
      </CardBox>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Tenant</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="library_name">Library Name</Label>
              <Input id="library_name" value={createForm.library_name} onChange={(e) => setCreateForm({ ...createForm, library_name: e.target.value })} required />
              {fieldError(createErrors, "library_name") && <p className="text-xs text-error">{fieldError(createErrors, "library_name")}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="admin_name">Admin Name</Label>
              <Input id="admin_name" value={createForm.admin_name} onChange={(e) => setCreateForm({ ...createForm, admin_name: e.target.value })} required />
              {fieldError(createErrors, "admin_name") && <p className="text-xs text-error">{fieldError(createErrors, "admin_name")}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} required />
              {fieldError(createErrors, "email") && <p className="text-xs text-error">{fieldError(createErrors, "email")}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput id="password" value={createForm.password} onChange={(v) => setCreateForm({ ...createForm, password: v })} autoComplete="new-password" required />
              {fieldError(createErrors, "password") && <p className="text-xs text-error">{fieldError(createErrors, "password")}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label>Subscription Plan (optional)</Label>
              <Select value={createForm.subscription_plan_id || "none"} onValueChange={(v) => setCreateForm({ ...createForm, subscription_plan_id: v === "none" ? "" : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="No plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No plan</SelectItem>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <Select value={createForm.status} onValueChange={(v) => setCreateForm({ ...createForm, status: v as TenantStatus })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {createForm.status === "trial" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="trial_days">Trial length (days)</Label>
                <Input
                  id="trial_days"
                  type="number"
                  min={1}
                  max={365}
                  value={createForm.trial_days}
                  onChange={(e) => setCreateForm({ ...createForm, trial_days: e.target.value })}
                />
                <p className="text-xs text-darklink">
                  {Number(createForm.trial_days) > 0
                    ? `Starts today, expires on ${formatDate(addDays(Number(createForm.trial_days)))}.`
                    : "Enter how many days the trial should run."}
                </p>
              </div>
            )}

            <DialogFooter className="lg:col-span-2 flex gap-2 mt-4">
              <Button type="submit" className="rounded-md" disabled={saving}>
                {saving ? "Creating..." : "Create"}
              </Button>
              <Button type="button" variant="outline" className="rounded-md" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Tenant</DialogTitle>
          </DialogHeader>
          {editing && (
            <form onSubmit={handleEdit} className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit_name">Name</Label>
                <Input id="edit_name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
                {fieldError(editErrors, "name") && <p className="text-xs text-error">{fieldError(editErrors, "name")}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit_email">Email</Label>
                <Input id="edit_email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required />
                {fieldError(editErrors, "email") && <p className="text-xs text-error">{fieldError(editErrors, "email")}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit_phone">Phone</Label>
                <Input id="edit_phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit_timezone">Timezone</Label>
                <Input id="edit_timezone" value={editForm.timezone} onChange={(e) => setEditForm({ ...editForm, timezone: e.target.value })} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v as TenantStatus })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {editForm.status === "trial" && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit_trial_ends_at">Trial ends on</Label>
                  <Input
                    id="edit_trial_ends_at"
                    type="date"
                    value={editForm.trial_ends_at}
                    onChange={(e) => setEditForm({ ...editForm, trial_ends_at: e.target.value })}
                  />
                  {editForm.trial_ends_at && (
                    <p className="text-xs text-darklink">
                      {(() => {
                        const days = daysUntil(editForm.trial_ends_at);
                        return days >= 0
                          ? `${days} day${days === 1 ? "" : "s"} left — expires on ${formatDate(editForm.trial_ends_at)}. The library locks until renewed once this passes.`
                          : `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago on ${formatDate(editForm.trial_ends_at)} — the library is locked until renewed.`;
                      })()}
                    </p>
                  )}
                  {fieldError(editErrors, "trial_ends_at") && <p className="text-xs text-error">{fieldError(editErrors, "trial_ends_at")}</p>}
                </div>
              )}

              <DialogFooter className="flex gap-2 mt-4">
                <Button type="submit" className="rounded-md" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button type="button" variant="outline" className="rounded-md" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This will permanently remove the tenant and all its data."
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}

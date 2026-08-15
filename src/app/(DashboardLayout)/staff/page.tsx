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
import PaginationBar from "@/components/shared/Pagination";
import TableSkeleton from "@/components/shared/TableSkeleton";
import DeleteConfirmDialog from "@/components/shared/DeleteConfirmDialog";
import PasswordInput from "@/components/form/PasswordInput";
import PhoneInput from "@/components/form/PhoneInput";
import { api, ApiError, invalidateDashboard } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import type { User, Paginated, StaffPermissions, PermissionDefinition } from "@/types";

const BCrumb = [{ to: "/", title: "Home" }, { title: "Staff" }];

type StaffDetail = User & { permissions?: StaffPermissions | null };

const avatarPalette = [
  "bg-lightsuccess text-success",
  "bg-lightinfo text-info",
  "bg-lightwarning text-warning",
  "bg-lightprimary text-primary",
  "bg-lighterror text-error",
  "bg-lightsecondary text-secondary",
];
const avatarColor = (id: number) => avatarPalette[id % avatarPalette.length];
const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");

function generatePassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => chars[v % chars.length]).join("");
}

const emptyForm = () => ({
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "staff" as "admin" | "staff",
  status: "active" as "active" | "inactive",
  permissions: [] as StaffPermissions,
});

export default function StaffPage() {
  const { authorized } = useRoleGuard(["admin"]);
  const { user } = useAuth();
  const toast = useToast();
  const [page, setPage] = useState(1);

  const { data: staff, isLoading: loading, error: loadError, mutate } = useApi<Paginated<User>>("/admin/staff", { page });
  const error = loadError ? "Unable to load staff." : null;

  // Single source of truth for the grantable permission list — never
  // hardcoded here, so a new key added to App\Support\Permissions on the
  // backend shows up in this panel automatically.
  const { data: permissionDefs } = useApi<PermissionDefinition[]>("/admin/permissions/definitions");
  const permissionGroups = (permissionDefs ?? []).reduce<Record<string, PermissionDefinition[]>>((acc, def) => {
    (acc[def.group] ??= []).push(def);
    return acc;
  }, {});

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFieldErrors({});
    setDialogOpen(true);
  };

  const openEdit = async (member: User) => {
    setEditing(member);
    setFieldErrors({});
    setDialogOpen(true);
    setLoadingDetail(true);
    try {
      // The list row doesn't carry this Library's role/permissions for that
      // staff member — fetch the full detail so the matrix can be prefilled.
      const detail = await api.get<StaffDetail>(`/admin/staff/${member.id}`);
      setForm({
        name: detail.name,
        email: detail.email || "",
        phone: detail.phone || "",
        password: "",
        role: detail.role as "admin" | "staff",
        status: detail.status,
        permissions: detail.permissions ?? [],
      });
    } catch {
      toast.error("Unable to load staff details.");
      setDialogOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleGeneratePassword = () => {
    setForm((f) => ({ ...f, password: generatePassword() }));
  };

  const togglePermission = (key: string) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter((k) => k !== key)
        : [...f.permissions, key],
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        role: form.role,
        status: form.status,
        // Permissions are only meaningful for staff — admin always has full
        // access regardless, so there's nothing useful to send for it.
        permissions: form.role === "staff" ? form.permissions : null,
      };
      if (editing) {
        if (form.password) payload.password = form.password;
        await api.put(`/admin/staff/${editing.id}`, payload);
        toast.success("Staff member updated.");
      } else {
        // No tenant_id here — a single admin/user only ever has one Library
        // now, so the backend just defaults to the caller's current one.
        payload.password = form.password;
        await api.post("/admin/staff", payload);
        toast.success("Staff member added.");
      }
      setDialogOpen(false);
      mutate();
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.errors || {});
        toast.error(err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/staff/${deleteTarget.id}`);
      toast.success("Staff member removed.");
      setDeleteTarget(null);
      mutate();
      invalidateDashboard();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const fieldError = (field: string) => fieldErrors[field]?.[0];

  if (!authorized) return null;

  return (
    <>
      <BreadcrumbComp title="Staff" items={BCrumb} />

      {/* Desktop (xl and up) — unchanged */}
      <div className="hidden xl:block">
      <CardBox className="p-0 bg-background overflow-hidden border-none rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center justify-end gap-4 p-6">
          <Button onClick={openCreate} className="flex items-center gap-1.5">
            <Icon icon="solar:add-circle-linear" width={18} height={18} />
            Add Staff
          </Button>
        </div>

        {error && <p className="px-6 pb-4 text-sm text-error">{error}</p>}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-6">Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pe-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton columns={6} />
              ) : staff?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-sm text-gray-500">No staff found</TableCell>
                </TableRow>
              ) : (
                staff?.data.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="ps-6 font-medium">{member.name}</TableCell>
                    <TableCell>{member.email || "—"}</TableCell>
                    <TableCell>{member.phone || "—"}</TableCell>
                    <TableCell className="capitalize">{member.role}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`border-none capitalize ${member.status === "active" ? "bg-lightsuccess text-success" : "bg-lighterror text-error"}`}
                      >
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pe-6">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(member)}>
                          <Icon icon="ic:outline-edit" width={16} height={16} />
                        </Button>
                        {member.role !== "admin" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-error hover:bg-error hover:text-white"
                            onClick={() => setDeleteTarget(member)}
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

        <PaginationBar meta={staff ?? null} onPageChange={setPage} />
      </CardBox>
      </div>

      {/* Mobile (below xl) — same card-list pattern as Members/Students */}
      <div className="xl:hidden flex flex-col gap-4">
        <div className="rounded-2xl bg-white dark:bg-darkgray p-4 shadow-xs flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-lightprimary flex items-center justify-center shrink-0">
            <Icon icon="solar:shield-user-bold-duotone" width={22} height={22} className="text-primary" />
          </div>
          <div>
            <p className="text-xs text-darklink">Total Staff</p>
            <p className="text-xl font-bold text-dark dark:text-white">{staff?.total ?? 0}</p>
          </div>
        </div>

        <Button onClick={openCreate} className="w-full flex items-center justify-center gap-1.5">
          <Icon icon="solar:add-circle-linear" width={18} height={18} />
          Add Staff
        </Button>

        {error && <p className="text-sm text-error">{error}</p>}

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-gray-100 dark:bg-darkgray animate-pulse" />
            ))}
          </div>
        ) : staff?.data.length === 0 ? (
          <p className="text-center py-8 text-sm text-gray-500">No staff found</p>
        ) : (
          <div className="flex flex-col gap-3">
            {staff?.data.map((member) => (
              <div key={member.id} className="rounded-2xl bg-white dark:bg-darkgray p-4 shadow-xs flex items-center gap-3">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 font-semibold ${avatarColor(member.id)}`}>
                  {initials(member.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-dark dark:text-white truncate">{member.name}</p>
                  <p className="text-xs text-darklink truncate">{member.email || member.phone || "—"}</p>
                  <p className="text-xs text-darklink capitalize mt-0.5">{member.role}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge
                    variant="secondary"
                    className={`border-none capitalize ${member.status === "active" ? "bg-lightsuccess text-success" : "bg-lighterror text-error"}`}
                  >
                    {member.status}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" aria-label="Staff actions" className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-lightprimary hover:text-primary">
                        <Icon icon="tabler:dots-vertical" width={18} height={18} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(member)}>
                        <Icon icon="ic:outline-edit" width={16} height={16} className="mr-2" />
                        Edit
                      </DropdownMenuItem>
                      {member.role !== "admin" && (
                        <DropdownMenuItem onClick={() => setDeleteTarget(member)} className="text-error">
                          <Icon icon="solar:trash-bin-trash-linear" width={16} height={16} className="mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}

        <PaginationBar meta={staff ?? null} onPageChange={setPage} />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Staff" : "Add Staff"}</DialogTitle>
          </DialogHeader>
          {loadingDetail ? (
            <p className="text-sm text-darklink py-6 text-center">Loading...</p>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                {fieldError("name") && <p className="text-xs text-error">{fieldError("name")}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email Address {!editing && "*"}</Label>
                <Input id="email" type="email" required={!editing} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                {fieldError("email") && <p className="text-xs text-error">{fieldError("email")}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">Mobile Number (optional)</Label>
                <PhoneInput id="phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{editing ? "New Password (optional)" : "Password *"}</Label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <Icon icon="tabler:refresh" width={14} height={14} />
                    Generate Password
                  </button>
                </div>
                <PasswordInput
                  id="password"
                  value={form.password}
                  onChange={(v) => setForm({ ...form, password: v })}
                  required={!editing}
                  showStrength
                />
                {fieldError("password") && <p className="text-xs text-error">{fieldError("password")}</p>}
              </div>
              {/* Only editing an existing account can change its role — adding
                  a new one here is always "add a Staff member", so there's
                  nothing to pick (Admin accounts are created elsewhere). */}
              {editing && (
                <div className="flex flex-col gap-2">
                  <Label>Role *</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as "admin" | "staff" })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
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

              {form.role === "staff" && (
                <div className="flex flex-col gap-2">
                  <Label>Permissions</Label>
                  <p className="text-xs text-darklink -mt-1">
                    Controls exactly what this staff member can see and do — enforced by the server, not just hidden in the UI. Toggle any permission on or off individually.
                  </p>
                  <div className="flex flex-col gap-3 rounded-lg border border-border p-4 max-h-72 overflow-y-auto">
                    {Object.keys(permissionGroups).length === 0 ? (
                      <p className="text-sm text-darklink">Loading permissions...</p>
                    ) : (
                      Object.entries(permissionGroups).map(([group, defs]) => (
                        <div key={group}>
                          <p className="text-xs font-semibold uppercase tracking-wide text-darklink mb-2">{group}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {defs.map((def) => (
                              <label key={def.key} className="flex items-center gap-2 text-sm cursor-pointer">
                                <Checkbox
                                  checked={form.permissions.includes(def.key)}
                                  onCheckedChange={() => togglePermission(def.key)}
                                />
                                {def.label}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <DialogFooter className="flex gap-2 mt-4">
                <Button type="submit" className="rounded-md" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button type="button" variant="outline" className="rounded-md" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        title={`Remove "${deleteTarget?.name}"?`}
        description="This will permanently remove this staff member's account."
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}

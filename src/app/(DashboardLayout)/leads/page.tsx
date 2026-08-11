"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
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
import PhoneInput from "@/components/form/PhoneInput";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/context/ToastContext";
import { usePermission } from "@/hooks/usePermission";
import { usePermissionGuard } from "@/hooks/usePermissionGuard";
import type { Lead, LeadStatus, Paginated } from "@/types";

const BCrumb = [{ to: "/", title: "Home" }, { title: "Leads / Inquiries" }];

const statusStyles: Record<LeadStatus, string> = {
  new: "bg-lightinfo text-info",
  contacted: "bg-lightwarning text-warning",
  converted: "bg-lightsuccess text-success",
  lost: "bg-lighterror text-error",
};

const emptyForm = { name: "", phone: "", whatsapp: "", whatsappSameAsPhone: true, notes: "" };

export default function LeadsPage() {
  const router = useRouter();
  const toast = useToast();
  const { authorized } = usePermissionGuard("members", "view");
  const canAdd = usePermission("members", "add");
  const canEdit = usePermission("members", "edit");
  const canDelete = usePermission("members", "delete");

  const [page, setPage] = useState(1);
  const { data: leads, isLoading: loading, error: loadError, mutate } = useApi<Paginated<Lead>>("/admin/leads", { page });
  const error = loadError ? "Unable to load leads." : null;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFieldErrors({});
    setDialogOpen(true);
  };

  const openEdit = (lead: Lead) => {
    setEditing(lead);
    setForm({
      name: lead.name,
      phone: lead.phone,
      whatsapp: lead.whatsapp_number || "",
      whatsappSameAsPhone: !lead.whatsapp_number || lead.whatsapp_number === lead.phone,
      notes: lead.notes || "",
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
        name: form.name,
        phone: form.phone,
        whatsapp_number: form.whatsappSameAsPhone || !form.whatsapp ? form.phone : form.whatsapp,
        notes: form.notes || undefined,
      };
      if (editing) {
        await api.put(`/admin/leads/${editing.id}`, payload);
        toast.success("Lead updated.");
      } else {
        await api.post("/admin/leads", payload);
        toast.success("Lead added.");
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
      await api.delete(`/admin/leads/${deleteTarget.id}`);
      toast.success("Lead deleted.");
      setDeleteTarget(null);
      mutate();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleConvert = (lead: Lead) => {
    const params = new URLSearchParams({ convert_lead: String(lead.id), name: lead.name, phone: lead.phone });
    if (lead.whatsapp_number) params.set("whatsapp", lead.whatsapp_number);
    router.push(`/members?${params.toString()}`);
  };

  const fieldError = (field: string) => fieldErrors[field]?.[0];

  if (!authorized) return null;

  return (
    <>
      <BreadcrumbComp title="Leads / Inquiries" items={BCrumb} />

      <CardBox className="p-0 bg-background overflow-hidden border-none rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <p className="text-sm text-darklink">Track enquiries before they become students — convert one into a Member when they're ready to join.</p>
          {canAdd && (
            <Button onClick={openCreate} className="flex items-center gap-1.5">
              <Icon icon="solar:add-circle-linear" width={18} height={18} />
              Add Lead
            </Button>
          )}
        </div>

        {error && <p className="px-6 pb-4 text-sm text-error">{error}</p>}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-6">Full Name</TableHead>
                <TableHead>Phone No.</TableHead>
                <TableHead>WhatsApp No.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pe-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton columns={5} />
              ) : leads?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-sm text-gray-500">No leads yet</TableCell>
                </TableRow>
              ) : (
                leads?.data.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="ps-6 text-sm font-medium">{lead.name}</TableCell>
                    <TableCell>{lead.phone}</TableCell>
                    <TableCell>{lead.whatsapp_number || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`border-none capitalize ${statusStyles[lead.status]}`}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pe-6">
                      <div className="flex justify-end gap-2">
                        {canAdd && lead.status !== "converted" && (
                          <Button size="sm" onClick={() => handleConvert(lead)} className="flex items-center gap-1.5">
                            <Icon icon="solar:user-plus-linear" width={16} height={16} />
                            Convert
                          </Button>
                        )}
                        {canEdit && (
                          <Button variant="outline" size="sm" onClick={() => openEdit(lead)}>
                            <Icon icon="ic:outline-edit" width={16} height={16} />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-error hover:bg-error hover:text-white"
                            onClick={() => setDeleteTarget(lead)}
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

        <PaginationBar meta={leads ?? null} onPageChange={setPage} />
      </CardBox>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Lead" : "Add Lead"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="lead-name">Full Name *</Label>
              <Input id="lead-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              {fieldError("name") && <p className="text-xs text-error">{fieldError("name")}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lead-phone">Phone No. *</Label>
              <PhoneInput id="lead-phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />
              {fieldError("phone") && <p className="text-xs text-error">{fieldError("phone")}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="lead-whatsapp">WhatsApp No. (Optional)</Label>
                <label className="flex items-center gap-1.5 text-xs text-darklink">
                  <input
                    type="checkbox"
                    checked={form.whatsappSameAsPhone}
                    onChange={(e) => setForm({ ...form, whatsappSameAsPhone: e.target.checked })}
                  />
                  Same as phone number
                </label>
              </div>
              {!form.whatsappSameAsPhone && (
                <PhoneInput id="lead-whatsapp" value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lead-notes">Notes (optional)</Label>
              <Textarea id="lead-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>

            <DialogFooter className="flex gap-2 mt-2">
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
        description="This will permanently remove the lead."
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}

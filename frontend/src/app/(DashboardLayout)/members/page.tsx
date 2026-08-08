"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
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
import { Icon } from "@iconify/react";
import PaginationBar from "@/components/shared/Pagination";
import TableSkeleton from "@/components/shared/TableSkeleton";
import DeleteConfirmDialog from "@/components/shared/DeleteConfirmDialog";
import { api, ApiError, storageUrl } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/context/ToastContext";
import DatePicker from "@/components/form/DatePicker";
import PhoneInput from "@/components/form/PhoneInput";
import ImageUploadField from "@/components/form/ImageUploadField";
import FileUploadField from "@/components/form/FileUploadField";
import type { Member, MemberStatus, MemberGender, Paginated } from "@/types";

const BCrumb = [{ to: "/", title: "Home" }, { title: "Members / Students" }];

const statuses: MemberStatus[] = ["active", "inactive", "expired"];
const genders: MemberGender[] = ["male", "female", "other"];

const statusStyles: Record<MemberStatus, string> = {
  active: "bg-lightsuccess text-success",
  inactive: "bg-lightwarning text-warning",
  expired: "bg-lighterror text-error",
};

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  id_proof_type: "",
  id_proof_number: "",
  date_of_birth: "",
  gender: "",
  join_date: new Date().toISOString().slice(0, 10),
  status: "active" as MemberStatus,
  notes: "",
};

export default function MembersPage() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data: members, isLoading: loading, error: loadError, mutate } = useApi<Paginated<Member>>("/admin/members", {
    page,
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const error = loadError ? "Unable to load members." : null;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [photo, setPhoto] = useState<File | null>(null);
  const [idProof, setIdProof] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setPhoto(null);
    setIdProof(null);
    setFieldErrors({});
    setDialogOpen(true);
  };

  const openEdit = (member: Member) => {
    setEditing(member);
    setForm({
      name: member.name,
      email: member.email || "",
      phone: member.phone,
      address: member.address || "",
      id_proof_type: member.id_proof_type || "",
      id_proof_number: member.id_proof_number || "",
      date_of_birth: member.date_of_birth || "",
      gender: member.gender || "",
      join_date: member.join_date,
      status: member.status,
      notes: member.notes || "",
    });
    setPhoto(null);
    setIdProof(null);
    setFieldErrors({});
    setDialogOpen(true);
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("name", form.name);
    if (form.email) fd.append("email", form.email);
    fd.append("phone", form.phone);
    if (form.address) fd.append("address", form.address);
    if (form.id_proof_type) fd.append("id_proof_type", form.id_proof_type);
    if (form.id_proof_number) fd.append("id_proof_number", form.id_proof_number);
    if (form.date_of_birth) fd.append("date_of_birth", form.date_of_birth);
    if (form.gender) fd.append("gender", form.gender);
    fd.append("join_date", form.join_date);
    fd.append("status", form.status);
    if (form.notes) fd.append("notes", form.notes);
    if (photo) fd.append("photo", photo);
    if (idProof) fd.append("id_proof", idProof);
    return fd;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    try {
      const fd = buildFormData();
      if (editing) {
        await api.put(`/admin/members/${editing.id}`, fd);
        toast.success("Member updated.");
      } else {
        await api.post("/admin/members", fd);
        toast.success("Member added.");
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
      await api.delete(`/admin/members/${deleteTarget.id}`);
      toast.success("Member deleted.");
      setDeleteTarget(null);
      mutate();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const fieldError = (field: string) => fieldErrors[field]?.[0];

  return (
    <>
      <BreadcrumbComp title="Members / Students" items={BCrumb} />

      <CardBox className="p-4 mb-4 bg-background border-none rounded-xl shadow-xs flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-lightprimary flex items-center justify-center shrink-0">
          <Icon icon="solar:users-group-rounded-bold-duotone" width={24} height={24} className="text-primary" />
        </div>
        <div>
          <p className="text-2xl font-semibold leading-none">{members?.total ?? 0}</p>
          <p className="text-sm text-darklink mt-1">Total Students</p>
        </div>
      </CardBox>

      <CardBox className="p-0 bg-background overflow-hidden border-none rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="flex flex-wrap gap-3">
            <div className="relative w-full sm:w-64">
              <Icon icon="solar:magnifer-linear" width={18} height={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-darklink" />
              <Input
                placeholder="Search members..."
                className="pl-10"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div className="w-full sm:w-40">
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
            Add Member
          </Button>
        </div>

        {error && <p className="px-6 pb-4 text-sm text-error">{error}</p>}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-6">Member</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pe-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton columns={5} />
              ) : members?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-sm text-gray-500">No members found</TableCell>
                </TableRow>
              ) : (
                members?.data.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="ps-6">
                      <div className="flex gap-3 items-center">
                        <Image
                          src={storageUrl(member.photo_path) || "/images/profile/user-1.jpg"}
                          alt={member.name}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.member_code}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{member.phone}</TableCell>
                    <TableCell>{member.activeSubscription?.plan?.name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`border-none capitalize ${statusStyles[member.status]}`}>
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pe-6">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(member)}>
                          <Icon icon="ic:outline-edit" width={16} height={16} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-error hover:bg-error hover:text-white"
                          onClick={() => setDeleteTarget(member)}
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

        <PaginationBar meta={members ?? null} onPageChange={setPage} />
      </CardBox>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Member" : "Add Member"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              {fieldError("name") && <p className="text-xs text-error">{fieldError("name")}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              {fieldError("email") && <p className="text-xs text-error">{fieldError("email")}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Phone</Label>
              <PhoneInput id="phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />
              {fieldError("phone") && <p className="text-xs text-error">{fieldError("phone")}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <DatePicker id="date_of_birth" value={form.date_of_birth} onChange={(v) => setForm({ ...form, date_of_birth: v })} placeholder="Select date of birth" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Gender</Label>
              <Select value={form.gender || "unspecified"} onValueChange={(v) => setForm({ ...form, gender: v === "unspecified" ? "" : v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unspecified">Unspecified</SelectItem>
                  {genders.map((g) => (
                    <SelectItem key={g} value={g} className="capitalize">{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2 lg:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="id_proof_type">ID Proof Type</Label>
              <Input id="id_proof_type" placeholder="e.g. Aadhaar" value={form.id_proof_type} onChange={(e) => setForm({ ...form, id_proof_type: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="id_proof_number">ID Proof Number</Label>
              <Input id="id_proof_number" value={form.id_proof_number} onChange={(e) => setForm({ ...form, id_proof_number: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="photo">Photo</Label>
              <ImageUploadField
                id="photo"
                value={photo}
                onChange={setPhoto}
                existingUrl={storageUrl(editing?.photo_path)}
                maxSizeMb={2}
              />
              {fieldError("photo") && <p className="text-xs text-error">{fieldError("photo")}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="id_proof">ID Proof File</Label>
              <FileUploadField
                id="id_proof"
                value={idProof}
                onChange={setIdProof}
                existingUrl={storageUrl(editing?.id_proof_path)}
                accept=".jpg,.jpeg,.png,.pdf"
                maxSizeMb={4}
                uploading={saving && !!idProof}
              />
              {fieldError("id_proof") && <p className="text-xs text-error">{fieldError("id_proof")}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="join_date">Join Date *</Label>
              <DatePicker id="join_date" value={form.join_date} onChange={(v) => setForm({ ...form, join_date: v })} placeholder="Select join date" />
              {fieldError("join_date") && <p className="text-xs text-error">{fieldError("join_date")}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as MemberStatus })}>
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
            <div className="flex flex-col gap-2 lg:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>

            <DialogFooter className="lg:col-span-2 flex gap-2 mt-4">
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
        description="This will permanently remove the member."
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}

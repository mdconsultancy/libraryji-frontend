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
import { Icon } from "@iconify/react";
import PaginationBar from "@/components/shared/Pagination";
import TableSkeleton from "@/components/shared/TableSkeleton";
import DeleteConfirmDialog from "@/components/shared/DeleteConfirmDialog";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/context/ToastContext";
import { useMemberOptions, useMembershipPlanOptions, useAvailableSeatOptions } from "@/hooks/useOptions";
import type { MemberSubscription, SubscriptionStatus, Paginated } from "@/types";

const BCrumb = [{ to: "/", title: "Home" }, { title: "Subscriptions" }];

const statuses: SubscriptionStatus[] = ["active", "expired", "cancelled"];

const statusStyles: Record<SubscriptionStatus, string> = {
  active: "bg-lightsuccess text-success",
  expired: "bg-lighterror text-error",
  cancelled: "bg-lightsecondary text-secondary",
};

export default function SubscriptionsPage() {
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data: subs, isLoading: loading, error: loadError, mutate } = useApi<Paginated<MemberSubscription>>("/admin/subscriptions", {
    page,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const error = loadError ? "Unable to load subscriptions." : null;

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const members = useMemberOptions(memberSearch);
  const plans = useMembershipPlanOptions();
  const [createForm, setCreateForm] = useState({ member_id: "", membership_plan_id: "", seat_id: "", start_date: new Date().toISOString().slice(0, 10), amount: "" });
  const selectedMember = members.find((m) => String(m.id) === createForm.member_id);
  const availableSeats = useAvailableSeatOptions(null);
  const [createErrors, setCreateErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  // Edit dialog
  const [editing, setEditing] = useState<MemberSubscription | null>(null);
  const [editForm, setEditForm] = useState({ seat_id: "", end_date: "", status: "active" as SubscriptionStatus });
  const editSeats = useAvailableSeatOptions(editing?.seat_id ?? null);
  const [editErrors, setEditErrors] = useState<Record<string, string[]>>({});

  // Renew dialog
  const [renewing, setRenewing] = useState<MemberSubscription | null>(null);
  const [renewForm, setRenewForm] = useState({ membership_plan_id: "", amount: "" });
  const [renewErrors, setRenewErrors] = useState<Record<string, string[]>>({});

  const [cancelTarget, setCancelTarget] = useState<MemberSubscription | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const openCreate = () => {
    setCreateForm({ member_id: "", membership_plan_id: "", seat_id: "", start_date: new Date().toISOString().slice(0, 10), amount: "" });
    setMemberSearch("");
    setCreateErrors({});
    setCreateOpen(true);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setCreateErrors({});
    try {
      await api.post("/admin/subscriptions", {
        member_id: Number(createForm.member_id),
        membership_plan_id: Number(createForm.membership_plan_id),
        seat_id: createForm.seat_id ? Number(createForm.seat_id) : null,
        start_date: createForm.start_date,
        amount: createForm.amount ? Number(createForm.amount) : undefined,
      });
      setCreateOpen(false);
      mutate();
    } catch (err) {
      if (err instanceof ApiError) setCreateErrors(err.errors || { general: [err.message] });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (sub: MemberSubscription) => {
    setEditing(sub);
    setEditForm({ seat_id: sub.seat_id ? String(sub.seat_id) : "", end_date: sub.end_date, status: sub.status });
    setEditErrors({});
  };

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setEditErrors({});
    try {
      await api.put(`/admin/subscriptions/${editing.id}`, {
        seat_id: editForm.seat_id ? Number(editForm.seat_id) : null,
        end_date: editForm.end_date,
        status: editForm.status,
      });
      setEditing(null);
      mutate();
    } catch (err) {
      if (err instanceof ApiError) setEditErrors(err.errors || {});
    } finally {
      setSaving(false);
    }
  };

  const openRenew = (sub: MemberSubscription) => {
    setRenewing(sub);
    setRenewForm({ membership_plan_id: String(sub.membership_plan_id), amount: "" });
    setRenewErrors({});
  };

  const handleRenew = async (e: FormEvent) => {
    e.preventDefault();
    if (!renewing) return;
    setSaving(true);
    setRenewErrors({});
    try {
      await api.post(`/admin/subscriptions/${renewing.id}/renew`, {
        membership_plan_id: renewForm.membership_plan_id ? Number(renewForm.membership_plan_id) : undefined,
        amount: renewForm.amount ? Number(renewForm.amount) : undefined,
      });
      setRenewing(null);
      mutate();
    } catch (err) {
      if (err instanceof ApiError) setRenewErrors(err.errors || {});
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await api.delete(`/admin/subscriptions/${cancelTarget.id}`);
      setCancelTarget(null);
      mutate();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to cancel subscription. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <BreadcrumbComp title="Subscriptions" items={BCrumb} />

      <CardBox className="p-0 bg-background overflow-hidden border-none rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="w-full sm:w-48">
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
          <Button onClick={openCreate} className="flex items-center gap-1.5">
            <Icon icon="solar:add-circle-linear" width={18} height={18} />
            New Subscription
          </Button>
        </div>

        {error && <p className="px-6 pb-4 text-sm text-error">{error}</p>}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-6">Member</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Seat</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pe-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton columns={8} />
              ) : subs?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-sm text-gray-500">No subscriptions found</TableCell>
                </TableRow>
              ) : (
                subs?.data.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="ps-6 font-medium">{sub.member?.name || `#${sub.member_id}`}</TableCell>
                    <TableCell>{sub.plan_name_snapshot}</TableCell>
                    <TableCell>{sub.seat?.seat_number || "—"}</TableCell>
                    <TableCell>{new Date(sub.start_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(sub.end_date).toLocaleDateString()}</TableCell>
                    <TableCell>₹{Number(sub.amount).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`border-none capitalize ${statusStyles[sub.status]}`}>
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pe-6">
                      <div className="flex justify-end gap-2">
                        {sub.status === "active" && (
                          <Button variant="outline" size="sm" onClick={() => openRenew(sub)}>
                            <Icon icon="solar:refresh-linear" width={16} height={16} />
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => openEdit(sub)}>
                          <Icon icon="ic:outline-edit" width={16} height={16} />
                        </Button>
                        {sub.status === "active" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-error hover:bg-error hover:text-white"
                            onClick={() => setCancelTarget(sub)}
                          >
                            <Icon icon="solar:close-circle-linear" width={16} height={16} />
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

        <PaginationBar meta={subs ?? null} onPageChange={setPage} />
      </CardBox>

      {/* Create Subscription */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Subscription</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {createErrors.general && <p className="text-sm text-error lg:col-span-2">{createErrors.general[0]}</p>}
            <div className="flex flex-col gap-2 lg:col-span-2">
              <Label>Member</Label>
              <Input placeholder="Search member by name, phone, code..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} className="mb-2" />
              <Select value={createForm.member_id} onValueChange={(v) => setCreateForm({ ...createForm, member_id: v, seat_id: "" })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.name} ({m.member_code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {createErrors.member_id && <p className="text-xs text-error">{createErrors.member_id[0]}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label>Membership Plan</Label>
              <Select value={createForm.membership_plan_id} onValueChange={(v) => setCreateForm({ ...createForm, membership_plan_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name} (₹{Number(p.price).toLocaleString()})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {createErrors.membership_plan_id && <p className="text-xs text-error">{createErrors.membership_plan_id[0]}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label>Seat (optional)</Label>
              <Select value={createForm.seat_id || "none"} onValueChange={(v) => setCreateForm({ ...createForm, seat_id: v === "none" ? "" : v })} disabled={!selectedMember}>
                <SelectTrigger>
                  <SelectValue placeholder={selectedMember ? "No seat" : "Select member first"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No seat</SelectItem>
                  {availableSeats.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.seat_number}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input id="start_date" type="date" value={createForm.start_date} onChange={(e) => setCreateForm({ ...createForm, start_date: e.target.value })} required />
              {createErrors.start_date && <p className="text-xs text-error">{createErrors.start_date[0]}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="amount">Amount (optional, defaults to plan price)</Label>
              <Input id="amount" type="number" min={0} step="0.01" value={createForm.amount} onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })} />
            </div>

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

      {/* Edit Subscription */}
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Subscription</DialogTitle>
          </DialogHeader>
          {editing && (
            <form onSubmit={handleEdit} className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Seat</Label>
                <Select value={editForm.seat_id || "none"} onValueChange={(v) => setEditForm({ ...editForm, seat_id: v === "none" ? "" : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="No seat" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No seat</SelectItem>
                    {editSeats.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.seat_number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input id="end_date" type="date" value={editForm.end_date} onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })} required />
                {editErrors.end_date && <p className="text-xs text-error">{editErrors.end_date[0]}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v as SubscriptionStatus })}>
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

      {/* Renew Subscription */}
      <Dialog open={!!renewing} onOpenChange={(v) => !v && setRenewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Renew Subscription</DialogTitle>
          </DialogHeader>
          {renewing && (
            <form onSubmit={handleRenew} className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Membership Plan</Label>
                <Select value={renewForm.membership_plan_id} onValueChange={(v) => setRenewForm({ ...renewForm, membership_plan_id: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name} (₹{Number(p.price).toLocaleString()})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="renew_amount">Amount (optional, defaults to plan price)</Label>
                <Input id="renew_amount" type="number" min={0} step="0.01" value={renewForm.amount} onChange={(e) => setRenewForm({ ...renewForm, amount: e.target.value })} />
              </div>

              <DialogFooter className="flex gap-2 mt-4">
                <Button type="submit" className="rounded-md" disabled={saving}>
                  {saving ? "Renewing..." : "Renew"}
                </Button>
                <Button type="button" variant="outline" className="rounded-md" onClick={() => setRenewing(null)}>
                  Cancel
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!cancelTarget}
        title="Cancel this subscription?"
        description="The seat (if assigned) will be freed and the subscription marked cancelled."
        loading={cancelling}
        onCancel={() => setCancelTarget(null)}
        onConfirm={handleCancel}
      />
    </>
  );
}

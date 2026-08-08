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
import { Icon } from "@iconify/react";
import PaginationBar from "@/components/shared/Pagination";
import TableSkeleton from "@/components/shared/TableSkeleton";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { useMemberOptions } from "@/hooks/useOptions";
import type { Payment, PaymentMethod, PaymentStatus, Paginated } from "@/types";

const BCrumb = [{ to: "/", title: "Home" }, { title: "Payments" }];

const methods: PaymentMethod[] = ["cash", "card", "upi", "bank_transfer", "razorpay", "stripe", "other"];
const statuses: PaymentStatus[] = ["pending", "paid", "failed", "refunded"];

const statusStyles: Record<PaymentStatus, string> = {
  paid: "bg-lightsuccess text-success",
  pending: "bg-lightwarning text-warning",
  failed: "bg-lighterror text-error",
  refunded: "bg-lightsecondary text-secondary",
};

const emptyForm = {
  member_id: "",
  type: "subscription" as "subscription" | "other",
  amount: "",
  payment_method: "cash" as PaymentMethod,
  status: "paid" as PaymentStatus,
  transaction_id: "",
  notes: "",
};

export default function PaymentsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data: payments, isLoading: loading, error: loadError, mutate } = useApi<Paginated<Payment>>("/admin/payments", {
    page,
    status: statusFilter !== "all" ? statusFilter : undefined,
    payment_method: methodFilter !== "all" ? methodFilter : undefined,
  });
  const error = loadError ? "Unable to load payments." : null;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const members = useMemberOptions(memberSearch);
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setMemberSearch("");
    setFieldErrors({});
    setDialogOpen(true);
  };

  const openEdit = (payment: Payment) => {
    setEditing(payment);
    setForm({
      member_id: payment.member_id ? String(payment.member_id) : "",
      type: payment.type,
      amount: String(payment.amount),
      payment_method: payment.payment_method,
      status: payment.status,
      transaction_id: payment.transaction_id || "",
      notes: payment.notes || "",
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
        await api.put(`/admin/payments/${editing.id}`, {
          amount: Number(form.amount),
          payment_method: form.payment_method,
          status: form.status,
          transaction_id: form.transaction_id || null,
          notes: form.notes || null,
        });
      } else {
        await api.post("/admin/payments", {
          member_id: form.member_id ? Number(form.member_id) : null,
          type: form.type,
          amount: Number(form.amount),
          payment_method: form.payment_method,
          status: form.status,
          transaction_id: form.transaction_id || null,
          notes: form.notes || null,
        });
      }
      setDialogOpen(false);
      mutate();
    } catch (err) {
      if (err instanceof ApiError) setFieldErrors(err.errors || {});
    } finally {
      setSaving(false);
    }
  };

  const fieldError = (field: string) => fieldErrors[field]?.[0];

  return (
    <>
      <BreadcrumbComp title="Payments" items={BCrumb} />

      <CardBox className="p-0 bg-background overflow-hidden border-none rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="flex flex-wrap gap-3">
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
            <div className="w-full sm:w-48">
              <Select value={methodFilter} onValueChange={(v) => { setMethodFilter(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All methods</SelectItem>
                  {methods.map((m) => (
                    <SelectItem key={m} value={m} className="capitalize">{m.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={openCreate} className="flex items-center gap-1.5">
            <Icon icon="solar:add-circle-linear" width={18} height={18} />
            Record Payment
          </Button>
        </div>

        {error && <p className="px-6 pb-4 text-sm text-error">{error}</p>}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-6">Invoice</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Paid At</TableHead>
                <TableHead className="text-right pe-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton columns={7} />
              ) : payments?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-sm text-gray-500">No payments found</TableCell>
                </TableRow>
              ) : (
                payments?.data.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="ps-6 font-medium">{payment.invoice_number}</TableCell>
                    <TableCell>{payment.member?.name || "—"}</TableCell>
                    <TableCell>₹{Number(payment.amount).toLocaleString()}</TableCell>
                    <TableCell className="capitalize">{payment.payment_method.replace('_', ' ')}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`border-none capitalize ${statusStyles[payment.status]}`}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : "—"}</TableCell>
                    <TableCell className="text-right pe-6">
                      <Button variant="outline" size="sm" onClick={() => openEdit(payment)}>
                        <Icon icon="ic:outline-edit" width={16} height={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <PaginationBar meta={payments ?? null} onPageChange={setPage} />
      </CardBox>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Payment" : "Record Payment"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {!editing && (
              <div className="flex flex-col gap-2 lg:col-span-2">
                <Label>Member (optional)</Label>
                <Input placeholder="Search member..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} className="mb-2" />
                <Select value={form.member_id || "none"} onValueChange={(v) => setForm({ ...form, member_id: v === "none" ? "" : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="No member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No member</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>{m.name} ({m.member_code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {!editing && (
              <div className="flex flex-col gap-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "subscription" | "other" })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subscription">Subscription</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" min={0} step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              {fieldError("amount") && <p className="text-xs text-error">{fieldError("amount")}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label>Payment Method</Label>
              <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v as PaymentMethod })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {methods.map((m) => (
                    <SelectItem key={m} value={m} className="capitalize">{m.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as PaymentStatus })}>
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="transaction_id">Transaction ID</Label>
              <Input id="transaction_id" value={form.transaction_id} onChange={(e) => setForm({ ...form, transaction_id: e.target.value })} />
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
    </>
  );
}

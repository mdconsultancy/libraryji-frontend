"use client";

import { useEffect, useState, FormEvent } from "react";
import { useSearchParams } from "next/navigation";
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
import PaginationBar from "@/components/shared/Pagination";
import TableSkeleton from "@/components/shared/TableSkeleton";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { useMemberOptions } from "@/hooks/useOptions";
import { usePermission } from "@/hooks/usePermission";
import { usePermissionGuard } from "@/hooks/usePermissionGuard";
import type { Payment, PaymentMethod, PaymentStatus, Paginated } from "@/types";

const BCrumb = [{ to: "/", title: "Home" }, { title: "Students Fee" }];

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
  const { authorized } = usePermissionGuard("payments", "view");
  const canAdd = usePermission("payments", "add");
  const canEdit = usePermission("payments", "edit");
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [memberIdFilter, setMemberIdFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Arrived via a member's "review" link from the Statements page (?member_id=...)
  // — scope the list to that student instead of showing every payment.
  useEffect(() => {
    setMemberIdFilter(searchParams.get("member_id"));
  }, [searchParams]);

  const { data: payments, isLoading: loading, error: loadError, mutate } = useApi<Paginated<Payment>>("/admin/payments", {
    page,
    search: search || undefined,
    member_id: memberIdFilter || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    payment_method: methodFilter !== "all" ? methodFilter : undefined,
  });
  const error = loadError ? "Unable to load payments." : null;
  const filteredMemberName = memberIdFilter ? payments?.data.find((p) => String(p.member_id) === memberIdFilter)?.member?.name : null;

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

  if (!authorized) return null;

  return (
    <>
      <BreadcrumbComp title="Students Fee" items={BCrumb} />

      {/* Desktop (xl and up) — unchanged */}
      <div className="hidden xl:block">
      <CardBox className="p-0 bg-background overflow-hidden border-none rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="flex flex-wrap gap-3">
            <div className="relative w-full sm:w-64">
              <Icon icon="solar:magnifer-linear" width={18} height={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-darklink" />
              <Input
                placeholder="Search by student, phone, invoice..."
                className="pl-10"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
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
          {canAdd && (
            <Button onClick={openCreate} className="flex items-center gap-1.5">
              <Icon icon="solar:add-circle-linear" width={18} height={18} />
              Record Payment
            </Button>
          )}
        </div>

        {memberIdFilter && (
          <div className="px-6 pb-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-lightprimary px-3 py-1.5 text-xs font-medium text-primary">
              Filtered for {filteredMemberName || `student #${memberIdFilter}`}
              <button type="button" onClick={() => setMemberIdFilter(null)} aria-label="Clear filter">
                <Icon icon="solar:close-circle-bold" width={16} height={16} />
              </button>
            </span>
          </div>
        )}

        {error && <p className="px-6 pb-4 text-sm text-error">{error}</p>}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-6">Seat / Invoice</TableHead>
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
                    <TableCell className="ps-6 font-medium">
                      {payment.subscription?.seat?.seat_number
                        ? `Seat ${payment.subscription.seat.seat_number}`
                        : payment.invoice_number}
                    </TableCell>
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
                      {canEdit && (
                        <Button variant="outline" size="sm" onClick={() => openEdit(payment)}>
                          <Icon icon="ic:outline-edit" width={16} height={16} />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <PaginationBar meta={payments ?? null} onPageChange={setPage} />
      </CardBox>
      </div>

      {/* Mobile (below xl) — same card-list pattern as Members/Students */}
      <div className="xl:hidden flex flex-col gap-4">
        {memberIdFilter && (
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-lightprimary px-3 py-1.5 text-xs font-medium text-primary">
            Filtered for {filteredMemberName || `student #${memberIdFilter}`}
            <button type="button" onClick={() => setMemberIdFilter(null)} aria-label="Clear filter">
              <Icon icon="solar:close-circle-bold" width={16} height={16} />
            </button>
          </span>
        )}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Icon icon="solar:magnifer-linear" width={18} height={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-darklink" />
            <Input
              placeholder="Search by student, phone, invoice..."
              className="pl-10"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((o) => !o)}
            aria-label="Toggle filters"
            className={`h-10 w-10 shrink-0 flex items-center justify-center rounded-md border border-border ${mobileFiltersOpen ? "bg-lightprimary text-primary border-primary" : ""}`}
          >
            <Icon icon="solar:tuning-2-linear" width={18} height={18} />
          </button>
        </div>

        {mobileFiltersOpen && (
          <div className="flex flex-col gap-2">
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
        )}

        <div className="rounded-2xl bg-white dark:bg-darkgray p-4 shadow-xs flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-lightprimary flex items-center justify-center shrink-0">
            <Icon icon="solar:bill-check-bold-duotone" width={22} height={22} className="text-primary" />
          </div>
          <div>
            <p className="text-xs text-darklink">Total Payments</p>
            <p className="text-xl font-bold text-dark dark:text-white">{payments?.total ?? 0}</p>
          </div>
        </div>

        {canAdd && (
          <Button onClick={openCreate} className="w-full flex items-center justify-center gap-1.5">
            <Icon icon="solar:add-circle-linear" width={18} height={18} />
            Record Payment
          </Button>
        )}

        {error && <p className="text-sm text-error">{error}</p>}

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-gray-100 dark:bg-darkgray animate-pulse" />
            ))}
          </div>
        ) : payments?.data.length === 0 ? (
          <p className="text-center py-8 text-sm text-gray-500">No payments found</p>
        ) : (
          <div className="flex flex-col gap-3">
            {payments?.data.map((payment) => (
              <div key={payment.id} className="rounded-2xl bg-white dark:bg-darkgray p-4 shadow-xs flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-lightprimary flex items-center justify-center shrink-0">
                  <Icon icon="solar:bill-check-bold-duotone" width={22} height={22} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-dark dark:text-white truncate">{payment.member?.name || payment.invoice_number}</p>
                  <p className="text-xs text-darklink truncate">₹{Number(payment.amount).toLocaleString()} · <span className="capitalize">{payment.payment_method.replace('_', ' ')}</span></p>
                  <p className="text-xs text-darklink mt-0.5">{payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : "—"}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge variant="secondary" className={`border-none capitalize ${statusStyles[payment.status]}`}>
                    {payment.status}
                  </Badge>
                  {canEdit && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button type="button" aria-label="Payment actions" className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-lightprimary hover:text-primary">
                          <Icon icon="tabler:dots-vertical" width={18} height={18} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(payment)}>
                          <Icon icon="ic:outline-edit" width={16} height={16} className="mr-2" />
                          Edit
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <PaginationBar meta={payments ?? null} onPageChange={setPage} />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Payment" : "Record Payment"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {!editing && (
              <div className="flex flex-col gap-2 xl:col-span-2">
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
            <div className="flex flex-col gap-2 xl:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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
    </>
  );
}

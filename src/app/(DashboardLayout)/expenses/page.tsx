"use client";

import { useMemo, useState, FormEvent } from "react";
import Link from "next/link";
import BreadcrumbComp from "@/app/(DashboardLayout)/layout/shared/breadcrumb/BreadcrumbComp";
import CardBox from "@/app/components/shared/CardBox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { api, ApiError, downloadFile } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/context/ToastContext";
import type { Expense, Payment, Paginated } from "@/types";

const BCrumb = [{ to: "/", title: "Home" }, { title: "Statements" }];

const currency = (value: number) => `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const monthStart = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = { category: "", title: "", amount: "", expense_date: today(), notes: "" };

export default function StatementsPage() {
  const toast = useToast();

  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());

  const resetToThisMonth = () => {
    setFrom(monthStart());
    setTo(today());
  };

  // Income side is read-only — sourced straight from student-fee payments, nothing to add here.
  const { data: incomeData, isLoading: loadingIncome, error: incomeError } = useApi<Paginated<Payment>>("/admin/payments", {
    status: "paid",
    from,
    to,
    per_page: 500,
  });
  const income = incomeData?.data ?? [];
  const totalIncome = useMemo(() => income.reduce((sum, p) => sum + Number(p.amount), 0), [income]);

  const { data: expensesData, isLoading: loadingExpenses, error: expensesError, mutate } = useApi<Paginated<Expense>>("/admin/expenses", {
    from,
    to,
    per_page: 500,
  });
  const expenses = expensesData?.data ?? [];
  const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + Number(e.amount), 0), [expenses]);

  const netBalance = totalIncome - totalExpenses;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [downloading, setDownloading] = useState<"pdf" | "xlsx" | null>(null);

  const handleDownload = async (format: "pdf" | "xlsx") => {
    setDownloading(format);
    try {
      await downloadFile(
        "/admin/statement/export",
        { from, to, format },
        `income-expense-statement-${from}-to-${to}.${format}`
      );
    } catch {
      toast.error("Unable to download the statement. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFieldErrors({});
    setDialogOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditing(expense);
    setForm({
      category: expense.category,
      title: expense.title,
      amount: String(expense.amount),
      expense_date: expense.expense_date,
      notes: expense.notes || "",
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
        category: form.category,
        title: form.title,
        amount: Number(form.amount),
        expense_date: form.expense_date,
        notes: form.notes || null,
      };
      if (editing) {
        await api.put(`/admin/expenses/${editing.id}`, payload);
      } else {
        await api.post("/admin/expenses", payload);
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
      await api.delete(`/admin/expenses/${deleteTarget.id}`);
      setDeleteTarget(null);
      mutate();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to delete expense. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const fieldError = (field: string) => fieldErrors[field]?.[0];

  return (
    <>
      <BreadcrumbComp title="Statements" items={BCrumb} />

      {/* Filter */}
      <CardBox className="p-4 sm:p-6 mb-30">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="from">From</Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full sm:w-44" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="to">To</Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full sm:w-44" />
          </div>
          <Button type="button" variant="outline" onClick={resetToThisMonth}>
            This Month
          </Button>
          <div className="flex gap-2 ms-auto">
            <Button type="button" variant="outline" disabled={downloading === "pdf"} onClick={() => handleDownload("pdf")}>
              <Icon icon="solar:file-text-linear" width={16} height={16} className="mr-1.5" />
              {downloading === "pdf" ? "Downloading..." : "PDF"}
            </Button>
            <Button type="button" variant="outline" disabled={downloading === "xlsx"} onClick={() => handleDownload("xlsx")}>
              <Icon icon="solar:file-download-linear" width={16} height={16} className="mr-1.5" />
              {downloading === "xlsx" ? "Downloading..." : "Excel"}
            </Button>
          </div>
        </div>
      </CardBox>

      {/* Income vs Expenses */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-30">
        {/* Income — auto from student fees, no manual entry */}
        <CardBox className="p-0 bg-background overflow-hidden border-none rounded-xl shadow-xs">
          <div className="flex items-center justify-between gap-4 p-6 pb-4">
            <h5 className="text-lg font-semibold">Income (Student Fees)</h5>
            <span className="text-base font-bold text-success">{currency(totalIncome)}</span>
          </div>

          {incomeError && <p className="px-6 pb-4 text-sm text-error">Unable to load income.</p>}

          <div className="flex flex-col gap-3 px-6 pb-6 max-h-[520px] overflow-y-auto">
            {loadingIncome ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-2xl bg-gray-100 dark:bg-darkgray animate-pulse" />
              ))
            ) : income.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">No fee payments in this period</p>
            ) : (
              income.map((payment) => (
                <Link
                  key={payment.id}
                  href={payment.member_id ? `/payments?member_id=${payment.member_id}` : "/payments"}
                  title="Review in Students Fee"
                  className="rounded-2xl bg-lightsuccess/40 dark:bg-darkgray p-3.5 flex items-center gap-3 transition-colors hover:bg-lightsuccess/70"
                >
                  <div className="h-10 w-10 rounded-full bg-lightsuccess flex items-center justify-center shrink-0">
                    <Icon icon="solar:wallet-money-bold-duotone" width={20} height={20} className="text-success" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-dark dark:text-white truncate">{payment.member?.name || payment.invoice_number}</p>
                    <p className="text-xs text-darklink truncate">{payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : "—"} · <span className="capitalize">{payment.payment_method.replace('_', ' ')}</span></p>
                  </div>
                  <span className="font-semibold text-success shrink-0">+{currency(Number(payment.amount))}</span>
                  <Icon icon="solar:alt-arrow-right-linear" width={16} height={16} className="text-success/70 shrink-0" />
                </Link>
              ))
            )}
          </div>
        </CardBox>

        {/* Expenses */}
        <CardBox className="p-0 bg-background overflow-hidden border-none rounded-xl shadow-xs">
          <div className="flex items-center justify-between gap-4 p-6 pb-4">
            <h5 className="text-lg font-semibold">Expenses</h5>
            <Button onClick={openCreate} size="sm" className="flex items-center gap-1.5">
              <Icon icon="solar:add-circle-linear" width={16} height={16} />
              Add Expense
            </Button>
          </div>

          {expensesError && <p className="px-6 pb-4 text-sm text-error">Unable to load expenses.</p>}

          <div className="flex flex-col gap-3 px-6 pb-6 max-h-[520px] overflow-y-auto">
            {loadingExpenses ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-2xl bg-gray-100 dark:bg-darkgray animate-pulse" />
              ))
            ) : expenses.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">No expenses in this period</p>
            ) : (
              expenses.map((expense) => (
                <div key={expense.id} className="rounded-2xl bg-lighterror/40 dark:bg-darkgray p-3.5 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-lighterror flex items-center justify-center shrink-0">
                    <Icon icon="solar:wallet-money-bold-duotone" width={20} height={20} className="text-error" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-dark dark:text-white truncate">{expense.title}</p>
                    <p className="text-xs text-darklink truncate">{expense.category} · {new Date(expense.expense_date).toLocaleDateString()}</p>
                  </div>
                  <span className="font-semibold text-error shrink-0">-{currency(Number(expense.amount))}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" aria-label="Expense actions" className="h-7 w-7 shrink-0 flex items-center justify-center rounded-full hover:bg-white dark:hover:bg-dark">
                        <Icon icon="tabler:dots-vertical" width={16} height={16} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(expense)}>
                        <Icon icon="ic:outline-edit" width={16} height={16} className="mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeleteTarget(expense)} className="text-error">
                        <Icon icon="solar:trash-bin-trash-linear" width={16} height={16} className="mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </div>
        </CardBox>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-30">
        <div className="rounded-2xl bg-white dark:bg-darkgray p-4 shadow-xs flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-lightsuccess flex items-center justify-center shrink-0">
            <Icon icon="solar:wallet-money-bold-duotone" width={22} height={22} className="text-success" />
          </div>
          <div>
            <p className="text-xs text-darklink">Total Income</p>
            <p className="text-xl font-bold text-dark dark:text-white">{currency(totalIncome)}</p>
          </div>
        </div>
        <div className="rounded-2xl bg-white dark:bg-darkgray p-4 shadow-xs flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-lighterror flex items-center justify-center shrink-0">
            <Icon icon="solar:wallet-money-bold-duotone" width={22} height={22} className="text-error" />
          </div>
          <div>
            <p className="text-xs text-darklink">Total Expenses</p>
            <p className="text-xl font-bold text-dark dark:text-white">{currency(totalExpenses)}</p>
          </div>
        </div>
        <div className="rounded-2xl bg-white dark:bg-darkgray p-4 shadow-xs flex items-center gap-3">
          <div className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 ${netBalance >= 0 ? "bg-lightsuccess" : "bg-lighterror"}`}>
            <Icon icon="solar:chart-2-bold-duotone" width={22} height={22} className={netBalance >= 0 ? "text-success" : "text-error"} />
          </div>
          <div>
            <p className="text-xs text-darklink">Net Balance</p>
            <p className={`text-xl font-bold ${netBalance >= 0 ? "text-success" : "text-error"}`}>{currency(netBalance)}</p>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Expense" : "Add Expense"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
              {fieldError("category") && <p className="text-xs text-error">{fieldError("category")}</p>}
            </div>
            <div className="flex flex-col gap-2 xl:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              {fieldError("title") && <p className="text-xs text-error">{fieldError("title")}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" min={0} step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              {fieldError("amount") && <p className="text-xs text-error">{fieldError("amount")}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="expense_date">Date</Label>
              <Input id="expense_date" type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} required />
              {fieldError("expense_date") && <p className="text-xs text-error">{fieldError("expense_date")}</p>}
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

      <DeleteConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.title}"?`}
        description="This will permanently remove the expense record."
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

    </>
  );
}

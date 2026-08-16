"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Icon } from "@iconify/react";
import PaginationBar from "@/components/shared/Pagination";
import TableSkeleton from "@/components/shared/TableSkeleton";
import DeleteConfirmDialog from "@/components/shared/DeleteConfirmDialog";
import { api, ApiError, downloadFile, invalidateDashboard } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { usePermissionGuard } from "@/hooks/usePermissionGuard";
import { useReadOnly } from "@/hooks/useReadOnly";
import AddMemberWizard from "@/components/members/AddMemberWizard";
import { whatsappLink, buildAdmissionMessage, buildPaymentReminderMessage } from "@/lib/whatsapp";
import type { Member, MemberStatus, Paginated, DashboardSummary, MemberHistoryEntry } from "@/types";

const BCrumb = [{ to: "/", title: "Home" }, { title: "Members / Students" }];

const statuses: MemberStatus[] = ["active", "inactive", "expired"];

const statusStyles: Record<MemberStatus, string> = {
  active: "bg-success text-white hover:bg-success/90",
  inactive: "bg-warning text-dark hover:bg-warning/90",
  expired: "bg-error text-white hover:bg-error/90",
};

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

function daysLeftLabel(member: Member): { text: string; className: string } {
  const sub = member.active_subscription;
  if (!sub) return { text: "—", className: "text-gray-400" };
  const days = sub.days_left ?? Math.ceil((new Date(sub.end_date.slice(0, 10) + "T00:00:00").getTime() - Date.now()) / 86400000);
  if (days < 0) return { text: "Expired", className: "text-error font-medium" };
  if (days === 0) return { text: "Today", className: "text-error font-medium" };
  if (days <= 5) return { text: `${days} day${days > 1 ? "s" : ""} left`, className: "text-warning font-medium" };
  return { text: `${days} days left`, className: "text-success font-medium" };
}

/** Mirrors DashboardController::summary()'s fee-status split (paid/partial/pending)
 *  so the badge shown here always agrees with the dashboard's own counts.
 *  Notably: an amount of 0 (a "Pending / Pay Later" admission where the fee
 *  was never entered) is NOT "nothing due, so Paid" — it reads as Pending,
 *  same as the dashboard does (`$due > 0` is required for the "paid" case). */
function feeStatus(member: Member): "paid" | "partial" | "pending" | null {
  const sub = member.active_subscription;
  if (!sub) return null;
  const due = Number(sub.amount);
  const paid = Number(sub.paid_amount ?? 0);
  if (paid >= due && due > 0) return "paid";
  if (paid > 0) return "partial";
  return "pending";
}

function feePendingLabel(member: Member) {
  const status = feeStatus(member);
  if (!status) return <span className="text-gray-400">—</span>;
  if (status === "paid") return <span className="text-success font-medium">Paid</span>;
  if (status === "partial") return <span className="text-warning font-medium">Partial</span>;
  return <span className="text-error font-medium">Pending</span>;
}

const whatsappHref = (member: Member) => {
  const number = (member.whatsapp_number || member.phone || "").replace(/[^\d]/g, "");
  return number ? `https://wa.me/${number}` : undefined;
};

/** Chat + template-message actions, grouped behind one WhatsApp icon so the
 *  row/detail-panel action bar doesn't grow every time a new message type
 *  is added. Messages are opened via wa.me pre-filled text — the user still
 *  taps Send in WhatsApp themselves (no automated/API sending). */
function WhatsAppMenu({ member }: { member: Member }) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const sub = member.active_subscription;
  const libraryName = user?.current_tenant?.name || "our library";
  const daysRemaining =
    sub?.days_left ?? (sub?.end_date ? Math.ceil((new Date(sub.end_date).getTime() - Date.now()) / 86400000) : null);

  const actions = [
    { key: "chat", label: "Open Chat", icon: "ic:baseline-whatsapp", href: whatsappLink(member) },
    {
      key: "welcome",
      label: "Send Welcome Message",
      icon: "solar:letter-linear",
      href: whatsappLink(member, buildAdmissionMessage(member, libraryName, user?.whatsapp_languages)),
    },
    ...(sub && daysRemaining !== null
      ? [
          {
            key: "reminder",
            label: "Send Fees Reminder",
            icon: "solar:bell-linear",
            href: whatsappLink(
              member,
              buildPaymentReminderMessage(member, libraryName, daysRemaining, {
                upiId: user?.upi_id,
                paymentNumber: user?.payment_number,
              }, user?.whatsapp_languages)
            ),
          },
        ]
      : []),
  ];

  // Mobile: a dropdown menu is fiddly to tap accurately on a small screen —
  // a full-screen-ish modal with large buttons matches how the rest of the
  // mobile layout (see the members mobile card list) favors bigger touch
  // targets over compact desktop-style menus.
  if (isMobile) {
    return (
      <>
        <Button
          variant="lightsuccess"
          size="sm"
          title="WhatsApp"
          onClick={() => setMobileOpen(true)}
        >
          <Icon icon="ic:baseline-whatsapp" width={16} height={16} />
        </Button>
        <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Message {member.name} on WhatsApp</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              {actions.map((action) => (
                <a
                  key={action.key}
                  href={action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-xl border border-border p-4 text-sm font-medium hover:bg-lightsuccess/40"
                >
                  <Icon icon={action.icon} width={20} height={20} className="text-success" />
                  {action.label}
                </a>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="lightsuccess" size="sm" title="WhatsApp">
          <Icon icon="ic:baseline-whatsapp" width={16} height={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action) => (
          <DropdownMenuItem key={action.key} asChild>
            <a href={action.href} target="_blank" rel="noopener noreferrer">
              <Icon icon={action.icon} width={16} height={16} className="mr-2" />
              {action.label}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function MembersPage() {
  const toast = useToast();
  const { authorized } = usePermissionGuard("members", "view");
  const readOnly = useReadOnly();
  const canAdd = usePermission("members", "add") && !readOnly;
  const canEdit = usePermission("members", "edit") && !readOnly;
  const canDelete = usePermission("members", "delete") && !readOnly;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [downloading, setDownloading] = useState<"pdf" | "xlsx" | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const handleDownload = async (format: "pdf" | "xlsx") => {
    setDownloading(format);
    try {
      await downloadFile(
        "/admin/members/export",
        selectedIds.size > 0
          ? { ids: Array.from(selectedIds).join(","), format }
          : { search: search || undefined, status: statusFilter !== "all" ? statusFilter : undefined, format },
        `students-list.${format}`
      );
    } catch {
      toast.error("Unable to download the students list. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const rows = members?.data ?? [];
      const allSelected = rows.length > 0 && rows.every((m) => prev.has(m.id));
      return allSelected ? new Set() : new Set(rows.map((m) => m.id));
    });
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const { data: members, isLoading: loading, error: loadError, mutate } = useApi<Paginated<Member>>("/admin/members", {
    page,
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const error = loadError ? "Unable to load members." : null;

  // Same summary endpoint the dashboard already uses — gives an account-wide
  // active/inactive split independent of whatever's currently filtered above.
  const { data: dashboardSummary } = useApi<DashboardSummary>("/admin/dashboard/summary");
  const totalMembers = dashboardSummary?.total_members ?? members?.total ?? 0;
  const activeMembers = dashboardSummary?.active_members ?? 0;
  const inactiveMembers = Math.max(totalMembers - activeMembers, 0);

  const router = useRouter();
  const searchParams = useSearchParams();

  // A single wizard drives both Add and Edit — Edit is just the wizard with
  // memberId set, prefilled from that member's data. See AddMemberWizard.tsx.
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [convertPrefill, setConvertPrefill] = useState<{ name?: string; phone?: string; whatsapp_number?: string; leadId?: number } | null>(null);

  // Arrived via a Lead's "Convert" action (?convert_lead=1&name=...&phone=...)
  // — open the wizard pre-filled instead of making the user retype it.
  useEffect(() => {
    const leadId = searchParams.get("convert_lead");
    if (!leadId) return;
    setEditingMemberId(null);
    setConvertPrefill({
      leadId: Number(leadId),
      name: searchParams.get("name") ?? undefined,
      phone: searchParams.get("phone") ?? undefined,
      whatsapp_number: searchParams.get("whatsapp") ?? undefined,
    });
    setWizardOpen(true);
    router.replace("/members");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Arrived via the header search bar (?search=...) — seed the members search box with it.
  useEffect(() => {
    const q = searchParams.get("search");
    if (q) setSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Arrived via the dashboard's "Add Member" card (?add=1) — open the wizard directly.
  useEffect(() => {
    if (!searchParams.get("add") || !canAdd) return;
    setEditingMemberId(null);
    setConvertPrefill(null);
    setWizardOpen(true);
    router.replace("/members");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const openCreate = () => {
    setEditingMemberId(null);
    setConvertPrefill(null);
    setWizardOpen(true);
  };

  const openEdit = (member: Member) => {
    setEditingMemberId(member.id);
    setConvertPrefill(null);
    setWizardOpen(true);
  };

  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [viewTargetId, setViewTargetId] = useState<number | null>(null);
  const { data: viewMember, isLoading: loadingViewMember } = useApi<Member>(
    viewTargetId ? `/admin/members/${viewTargetId}` : null
  );
  const { data: historyEntries, isLoading: loadingHistory } = useApi<MemberHistoryEntry[]>(
    viewTargetId ? `/admin/members/${viewTargetId}/history` : null
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/members/${deleteTarget.id}`);
      toast.success("Member deleted.");
      setDeleteTarget(null);
      mutate();
      invalidateDashboard();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (!authorized) return null;

  return (
    <>
      <BreadcrumbComp title="Members / Students" items={BCrumb} />

      {/* Desktop (xl and up) — unchanged */}
      <div className="hidden xl:block">
      <div className="grid grid-cols-4 gap-4 mb-4">
        <CardBox className="p-4 bg-[#7C3AED]/20 border border-[#7C3AED]/20 dark:bg-[#7C3AED]/15 dark:border-[#7C3AED]/20 rounded-xl shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-[#7C3AED] flex items-center justify-center shrink-0">
            <Icon icon="solar:users-group-rounded-bold-duotone" width={24} height={24} className="text-white" />
          </div>
          <div>
            <p className="text-2xl font-semibold leading-none">{members?.total ?? 0}</p>
            <p className="text-sm text-darklink mt-1">Total Students</p>
          </div>
        </CardBox>
        <CardBox className="p-4 bg-[#16A34A]/20 border border-[#16A34A]/20 dark:bg-[#16A34A]/15 dark:border-[#16A34A]/20 rounded-xl shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-[#16A34A] flex items-center justify-center shrink-0">
            <Icon icon="solar:check-circle-bold-duotone" width={24} height={24} className="text-white" />
          </div>
          <div>
            <p className="text-2xl font-semibold leading-none">{dashboardSummary?.fee_paid_students ?? 0}</p>
            <p className="text-sm text-darklink mt-1">Fee Paid</p>
          </div>
        </CardBox>
        <CardBox className="p-4 bg-[#EA580C]/20 border border-[#EA580C]/20 dark:bg-[#EA580C]/15 dark:border-[#EA580C]/20 rounded-xl shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-[#EA580C] flex items-center justify-center shrink-0">
            <Icon icon="solar:hourglass-line-bold-duotone" width={24} height={24} className="text-white" />
          </div>
          <div>
            <p className="text-2xl font-semibold leading-none">{dashboardSummary?.partial_fee_students ?? 0}</p>
            <p className="text-sm text-darklink mt-1">Partial Fee</p>
          </div>
        </CardBox>
        <CardBox className="p-4 bg-[#DC2626]/20 border border-[#DC2626]/20 dark:bg-[#DC2626]/15 dark:border-[#DC2626]/20 rounded-xl shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-[#DC2626] flex items-center justify-center shrink-0">
            <Icon icon="solar:danger-circle-bold-duotone" width={24} height={24} className="text-white" />
          </div>
          <div>
            <p className="text-2xl font-semibold leading-none">{dashboardSummary?.fee_pending_students ?? 0}</p>
            <p className="text-sm text-darklink mt-1">Fee Pending</p>
          </div>
        </CardBox>
      </div>

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
          <div className="flex flex-wrap gap-2">
            {canDelete && (
              <Button type="button" variant="outline" asChild>
                <Link href="/members/trash">
                  <Icon icon="solar:trash-bin-2-linear" width={16} height={16} className="mr-1.5" />
                  Trash
                </Link>
              </Button>
            )}
            <Button type="button" variant="outline" disabled={downloading === "pdf"} onClick={() => handleDownload("pdf")}>
              <Icon icon="solar:file-text-linear" width={16} height={16} className="mr-1.5" />
              {downloading === "pdf" ? "Downloading..." : selectedIds.size > 0 ? `PDF (${selectedIds.size})` : "PDF"}
            </Button>
            <Button type="button" variant="outline" disabled={downloading === "xlsx"} onClick={() => handleDownload("xlsx")}>
              <Icon icon="solar:file-download-linear" width={16} height={16} className="mr-1.5" />
              {downloading === "xlsx" ? "Downloading..." : selectedIds.size > 0 ? `Excel (${selectedIds.size})` : "Excel"}
            </Button>
            {selectedIds.size > 0 && (
              <Button type="button" variant="ghost" onClick={() => setSelectedIds(new Set())}>
                Clear selection
              </Button>
            )}
            {canAdd && (
              <Button onClick={openCreate} className="flex items-center gap-1.5">
                <Icon icon="solar:add-circle-linear" width={18} height={18} />
                Add Member
              </Button>
            )}
          </div>
        </div>

        {error && <p className="px-6 pb-4 text-sm text-error">{error}</p>}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-6 w-10">
                  <Checkbox
                    checked={(members?.data.length ?? 0) > 0 && members!.data.every((m) => selectedIds.has(m.id))}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Seat</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Days Left</TableHead>
                <TableHead>Fee Status</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pe-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton columns={8} />
              ) : members?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-sm text-gray-500">No members found</TableCell>
                </TableRow>
              ) : (
                members?.data.map((member) => (
                  <TableRow key={member.id} className={selectedIds.has(member.id) ? "bg-lightprimary/40" : undefined}>
                    <TableCell className="ps-6">
                      <Checkbox
                        checked={selectedIds.has(member.id)}
                        onCheckedChange={() => toggleSelectOne(member.id)}
                        aria-label={`Select ${member.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-3 items-center">
                        <Image
                          src={member.photo_url || "/images/profile/user-1.jpg"}
                          alt={member.name}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.email || member.member_code}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{member.active_subscription?.seat?.seat_number || "—"}</TableCell>
                    <TableCell>{member.phone}</TableCell>
                    <TableCell>
                      <span className={daysLeftLabel(member).className}>{daysLeftLabel(member).text}</span>
                    </TableCell>
                    <TableCell>{feePendingLabel(member)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`border-none capitalize ${statusStyles[member.status]}`}>
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pe-6">
                      <div className="flex justify-end gap-2">
                        {whatsappHref(member) && <WhatsAppMenu member={member} />}
                        <Button variant="lightprimary" size="sm" title="View" onClick={() => setViewTargetId(member.id)}>
                          <Icon icon="solar:eye-linear" width={16} height={16} />
                        </Button>
                        {canEdit && (
                          <Button variant="lightprimary" size="sm" onClick={() => openEdit(member)}>
                            <Icon icon="ic:outline-edit" width={16} height={16} />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="lighterror"
                            size="sm"
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

        <PaginationBar meta={members ?? null} onPageChange={setPage} />
      </CardBox>
      </div>

      {/* Mobile (below xl) — separate card-list layout, same data/handlers */}
      <div className="xl:hidden flex flex-col gap-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Icon icon="solar:magnifer-linear" width={18} height={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-darklink" />
            <Input
              placeholder="Search by name, email or phone..."
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
        )}

        <div className="rounded-2xl bg-[#7C3AED]/20 dark:bg-[#7C3AED]/15 p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-[#7C3AED] flex items-center justify-center shrink-0">
              <Icon icon="solar:users-group-rounded-bold-duotone" width={22} height={22} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-darklink">Total Members</p>
              <p className="text-xl font-bold text-dark dark:text-white">{totalMembers}</p>
            </div>
          </div>
          <div className="text-right text-xs text-darklink">
            <p>Active <span className="text-success font-semibold">{activeMembers}</span></p>
            <p className="mt-1">Inactive <span className="text-error font-semibold">{inactiveMembers}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-[#16A34A]/20 dark:bg-[#16A34A]/15 p-3 shadow-xs text-center">
            <p className="text-lg font-bold text-[#16A34A]">{dashboardSummary?.fee_paid_students ?? 0}</p>
            <p className="text-[11px] text-darklink">Fee Paid</p>
          </div>
          <div className="rounded-2xl bg-[#EA580C]/20 dark:bg-[#EA580C]/15 p-3 shadow-xs text-center">
            <p className="text-lg font-bold text-[#EA580C]">{dashboardSummary?.partial_fee_students ?? 0}</p>
            <p className="text-[11px] text-darklink">Partial</p>
          </div>
          <div className="rounded-2xl bg-[#DC2626]/20 dark:bg-[#DC2626]/15 p-3 shadow-xs text-center">
            <p className="text-lg font-bold text-[#DC2626]">{dashboardSummary?.fee_pending_students ?? 0}</p>
            <p className="text-[11px] text-darklink">Pending</p>
          </div>
        </div>

        {canAdd && (
          <Button onClick={openCreate} className="w-full flex items-center justify-center gap-1.5">
            <Icon icon="solar:add-circle-linear" width={18} height={18} />
            Add Member
          </Button>
        )}

        {error && <p className="text-sm text-error">{error}</p>}

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-gray-100 dark:bg-darkgray animate-pulse" />
            ))}
          </div>
        ) : members?.data.length === 0 ? (
          <p className="text-center py-8 text-sm text-gray-500">No members found</p>
        ) : (
          <div className="flex flex-col gap-3">
            {members?.data.map((member) => (
              <div key={member.id} className="rounded-2xl bg-white dark:bg-darkgray p-4 shadow-xs flex items-center gap-3">
                {member.photo_url ? (
                  <Image
                    src={member.photo_url}
                    alt={member.name}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 font-semibold ${avatarColor(member.id)}`}>
                    {initials(member.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-dark dark:text-white truncate">{member.name}</p>
                  <p className="text-xs text-darklink truncate">{member.email || member.member_code}</p>
                  <p className="text-xs text-darklink flex items-center gap-1 mt-0.5">
                    <Icon icon="solar:phone-linear" width={12} height={12} />
                    {member.phone}
                  </p>
                  <p className={`text-xs flex items-center gap-1 mt-0.5 ${daysLeftLabel(member).className}`}>
                    <Icon icon="solar:calendar-linear" width={12} height={12} />
                    {daysLeftLabel(member).text}
                    {member.active_subscription?.seat?.seat_number && (
                      <span className="text-darklink">· Seat {member.active_subscription.seat.seat_number}</span>
                    )}
                  </p>
                  <p className="text-xs flex items-center gap-1 mt-0.5">{feePendingLabel(member)}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge variant="secondary" className={`border-none capitalize ${statusStyles[member.status]}`}>
                    {member.status}
                  </Badge>
                  {whatsappHref(member) && <WhatsAppMenu member={member} />}
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button type="button" aria-label="Member actions" className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-lightprimary hover:text-primary">
                          <Icon icon="tabler:dots-vertical" width={18} height={18} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewTargetId(member.id)}>
                          <Icon icon="solar:eye-linear" width={16} height={16} className="mr-2" />
                          View
                        </DropdownMenuItem>
                        {canEdit && (
                          <DropdownMenuItem onClick={() => openEdit(member)}>
                            <Icon icon="ic:outline-edit" width={16} height={16} className="mr-2" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {canDelete && (
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

        <PaginationBar meta={members ?? null} onPageChange={setPage} />
      </div>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This will permanently remove the member."
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <AddMemberWizard
        open={wizardOpen}
        onClose={() => {
          setWizardOpen(false);
          setEditingMemberId(null);
          setConvertPrefill(null);
        }}
        onSaved={mutate}
        memberId={editingMemberId ?? undefined}
        prefill={convertPrefill ?? undefined}
      />

      <Dialog open={!!viewTargetId} onOpenChange={(v) => !v && setViewTargetId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {loadingViewMember || !viewMember ? (
            <p className="text-sm text-gray-500 py-10 text-center">Loading...</p>
          ) : (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  {viewMember.photo_url ? (
                    <Image
                      src={viewMember.photo_url}
                      alt={viewMember.name}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center font-semibold ${avatarColor(viewMember.id)}`}>
                      {initials(viewMember.name)}
                    </div>
                  )}
                  <div>
                    <DialogTitle>{viewMember.name}</DialogTitle>
                    <p className="text-xs text-darklink">{viewMember.member_code}</p>
                  </div>
                  <Badge variant="secondary" className={`border-none capitalize ml-auto ${statusStyles[viewMember.status]}`}>
                    {viewMember.status}
                  </Badge>
                </div>
              </DialogHeader>

              <ViewSection title="Contact">
                <ViewField label="Phone" value={viewMember.phone} />
                <ViewField label="WhatsApp" value={viewMember.whatsapp_number} />
                <ViewField label="Email" value={viewMember.email} />
                <ViewField label="Gender" value={viewMember.gender} className="capitalize" />
                <ViewField label="Date of Birth" value={viewMember.date_of_birth ? new Date(viewMember.date_of_birth).toLocaleDateString("en-IN") : null} />
                <ViewField label="Address" value={viewMember.address} />
              </ViewSection>

              <ViewSection title="Membership">
                <ViewField label="Plan" value={viewMember.active_subscription?.plan_name_snapshot} />
                <ViewField label="Seat" value={viewMember.active_subscription?.seat?.seat_number} />
                <ViewField label="Join Date" value={viewMember.join_date ? new Date(viewMember.join_date).toLocaleDateString("en-IN") : null} />
                <ViewField
                  label="Valid Till"
                  value={viewMember.active_subscription?.end_date ? new Date(viewMember.active_subscription.end_date).toLocaleDateString("en-IN") : null}
                />
                <ViewField
                  label="Fees"
                  value={viewMember.active_subscription?.amount != null ? `₹${Number(viewMember.active_subscription.amount).toLocaleString("en-IN")}` : null}
                />
                <ViewField label="Fee Status" value={feePendingLabel(viewMember)} />
              </ViewSection>

              {(viewMember.id_proof_type || viewMember.id_proof_number) && (
                <ViewSection title="ID Proof">
                  <ViewField label="Type" value={viewMember.id_proof_type} />
                  <ViewField label="Number" value={viewMember.id_proof_number} />
                </ViewSection>
              )}

              {viewMember.notes && (
                <ViewSection title="Notes">
                  <p className="text-sm text-dark dark:text-white col-span-2">{viewMember.notes}</p>
                </ViewSection>
              )}

              {viewMember.last_updated_by && (
                <p className="text-xs text-darklink mt-2">
                  Last updated by {viewMember.last_updated_by}
                  {viewMember.last_updated_at ? ` on ${new Date(viewMember.last_updated_at).toLocaleString()}` : ""}
                </p>
              )}

              <div className="mt-4">
                <h6 className="text-sm font-semibold mb-2">Activity History</h6>
                <div className="max-h-40 overflow-y-auto flex flex-col gap-2 rounded-lg border border-border p-3">
                  {loadingHistory ? (
                    <p className="text-sm text-gray-500 py-3 text-center">Loading...</p>
                  ) : !historyEntries || historyEntries.length === 0 ? (
                    <p className="text-sm text-gray-500 py-3 text-center">No activity recorded yet.</p>
                  ) : (
                    historyEntries.map((entry, i) => (
                      <div key={i} className="border-b border-border pb-2 last:border-none last:pb-0">
                        <p className="text-sm font-medium text-dark dark:text-white">
                          <span className="capitalize">{entry.action}</span> by {entry.user_name}
                        </p>
                        <p className="text-xs text-darklink">{new Date(entry.created_at).toLocaleString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function ViewSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-4">
      <h6 className="text-sm font-semibold mb-2">{title}</h6>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border border-border p-3">{children}</div>
    </div>
  );
}

function ViewField({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-sm text-dark dark:text-white ${className ?? ""}`}>{value || "—"}</p>
    </div>
  );
}

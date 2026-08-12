"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
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
import { Icon } from "@iconify/react";
import PaginationBar from "@/components/shared/Pagination";
import TableSkeleton from "@/components/shared/TableSkeleton";
import DeleteConfirmDialog from "@/components/shared/DeleteConfirmDialog";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/context/ToastContext";
import { usePermission } from "@/hooks/usePermission";
import { usePermissionGuard } from "@/hooks/usePermissionGuard";
import AddMemberWizard from "@/components/members/AddMemberWizard";
import type { Member, MemberStatus, Paginated, DashboardSummary } from "@/types";

const BCrumb = [{ to: "/", title: "Home" }, { title: "Members / Students" }];

const statuses: MemberStatus[] = ["active", "inactive", "expired"];

const statusStyles: Record<MemberStatus, string> = {
  active: "bg-lightsuccess text-success",
  inactive: "bg-lightwarning text-warning",
  expired: "bg-lighterror text-error",
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
  if (days <= 3) return { text: `${days} day${days > 1 ? "s" : ""} left`, className: "text-error font-medium" };
  if (days <= 7) return { text: `${days} days left`, className: "text-warning font-medium" };
  return { text: `${days} days left`, className: "text-darklink" };
}

const whatsappHref = (member: Member) => {
  const number = (member.whatsapp_number || member.phone || "").replace(/[^\d]/g, "");
  return number ? `https://wa.me/${number}` : undefined;
};

export default function MembersPage() {
  const toast = useToast();
  const { authorized } = usePermissionGuard("members", "view");
  const canAdd = usePermission("members", "add");
  const canEdit = usePermission("members", "edit");
  const canDelete = usePermission("members", "delete");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
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

  if (!authorized) return null;

  return (
    <>
      <BreadcrumbComp title="Members / Students" items={BCrumb} />

      {/* Desktop (xl and up) — unchanged */}
      <div className="hidden xl:block">
      <div className="grid grid-cols-4 gap-4 mb-4">
        <CardBox className="p-4 bg-background border-none rounded-xl shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-lightprimary flex items-center justify-center shrink-0">
            <Icon icon="solar:users-group-rounded-bold-duotone" width={24} height={24} className="text-primary" />
          </div>
          <div>
            <p className="text-2xl font-semibold leading-none">{members?.total ?? 0}</p>
            <p className="text-sm text-darklink mt-1">Total Students</p>
          </div>
        </CardBox>
        <CardBox className="p-4 bg-background border-none rounded-xl shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-lightsuccess flex items-center justify-center shrink-0">
            <Icon icon="solar:check-circle-bold-duotone" width={24} height={24} className="text-success" />
          </div>
          <div>
            <p className="text-2xl font-semibold leading-none">{dashboardSummary?.fee_paid_students ?? 0}</p>
            <p className="text-sm text-darklink mt-1">Fee Paid</p>
          </div>
        </CardBox>
        <CardBox className="p-4 bg-background border-none rounded-xl shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-lightwarning flex items-center justify-center shrink-0">
            <Icon icon="solar:hourglass-line-bold-duotone" width={24} height={24} className="text-warning" />
          </div>
          <div>
            <p className="text-2xl font-semibold leading-none">{dashboardSummary?.partial_fee_students ?? 0}</p>
            <p className="text-sm text-darklink mt-1">Partial Fee</p>
          </div>
        </CardBox>
        <CardBox className="p-4 bg-background border-none rounded-xl shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-lighterror flex items-center justify-center shrink-0">
            <Icon icon="solar:danger-circle-bold-duotone" width={24} height={24} className="text-error" />
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
          {canAdd && (
            <Button onClick={openCreate} className="flex items-center gap-1.5">
              <Icon icon="solar:add-circle-linear" width={18} height={18} />
              Add Member
            </Button>
          )}
        </div>

        {error && <p className="px-6 pb-4 text-sm text-error">{error}</p>}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-6">Member</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Days Left</TableHead>
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
                          src={member.photo_url || "/images/profile/user-1.jpg"}
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
                    <TableCell>
                      <span className={daysLeftLabel(member).className}>{daysLeftLabel(member).text}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`border-none capitalize ${statusStyles[member.status]}`}>
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pe-6">
                      <div className="flex justify-end gap-2">
                        {whatsappHref(member) && (
                          <Button variant="outline" size="sm" className="text-success hover:bg-success hover:text-white" asChild>
                            <a href={whatsappHref(member)} target="_blank" rel="noopener noreferrer" title="Message on WhatsApp">
                              <Icon icon="ic:baseline-whatsapp" width={16} height={16} />
                            </a>
                          </Button>
                        )}
                        {canEdit && (
                          <Button variant="outline" size="sm" onClick={() => openEdit(member)}>
                            <Icon icon="ic:outline-edit" width={16} height={16} />
                          </Button>
                        )}
                        {canDelete && (
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

        <div className="rounded-2xl bg-white dark:bg-darkgray p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-lightprimary flex items-center justify-center shrink-0">
              <Icon icon="solar:users-group-rounded-bold-duotone" width={22} height={22} className="text-primary" />
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
          <div className="rounded-2xl bg-white dark:bg-darkgray p-3 shadow-xs text-center">
            <p className="text-lg font-bold text-success">{dashboardSummary?.fee_paid_students ?? 0}</p>
            <p className="text-[11px] text-darklink">Fee Paid</p>
          </div>
          <div className="rounded-2xl bg-white dark:bg-darkgray p-3 shadow-xs text-center">
            <p className="text-lg font-bold text-warning">{dashboardSummary?.partial_fee_students ?? 0}</p>
            <p className="text-[11px] text-darklink">Partial</p>
          </div>
          <div className="rounded-2xl bg-white dark:bg-darkgray p-3 shadow-xs text-center">
            <p className="text-lg font-bold text-error">{dashboardSummary?.fee_pending_students ?? 0}</p>
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
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge variant="secondary" className={`border-none capitalize ${statusStyles[member.status]}`}>
                    {member.status}
                  </Badge>
                  {whatsappHref(member) && (
                    <a
                      href={whatsappHref(member)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Message on WhatsApp"
                      className="h-7 w-7 flex items-center justify-center rounded-full text-success hover:bg-lightsuccess"
                    >
                      <Icon icon="ic:baseline-whatsapp" width={18} height={18} />
                    </a>
                  )}
                  {(canEdit || canDelete) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button type="button" aria-label="Member actions" className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-lightprimary hover:text-primary">
                          <Icon icon="tabler:dots-vertical" width={18} height={18} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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
                  )}
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
    </>
  );
}

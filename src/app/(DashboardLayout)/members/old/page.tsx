"use client";

import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Icon } from "@iconify/react";
import PaginationBar from "@/components/shared/Pagination";
import TableSkeleton from "@/components/shared/TableSkeleton";
import DeleteConfirmDialog from "@/components/shared/DeleteConfirmDialog";
import { api, ApiError, invalidateDashboard, invalidatePayments } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/context/ToastContext";
import { usePermissionGuard } from "@/hooks/usePermissionGuard";
import { usePermission } from "@/hooks/usePermission";
import { useReadOnly } from "@/hooks/useReadOnly";
import type { Member, Paginated } from "@/types";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const BCrumb = [
  { to: "/", title: "Home" },
  { to: "/members", title: "Members / Students" },
  { title: "Old Students / Members" },
];

export default function OldMembersPage() {
  const toast = useToast();
  const { authorized } = usePermissionGuard("members", "view");
  const canDelete = usePermission("members", "delete");
  const readOnly = useReadOnly();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const { data: members, isLoading: loading, error: loadError, mutate } = useApi<Paginated<Member>>("/admin/members/trashed", {
    page,
    search: search || undefined,
  });
  const error = loadError ? "Unable to load old students." : null;

  const handleRestore = async (member: Member) => {
    setRestoringId(member.id);
    try {
      await api.post(`/admin/members/${member.id}/restore`);
      toast.success(`${member.name} restored to active students.`);
      mutate();
      invalidateDashboard();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    } finally {
      setRestoringId(null);
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

  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const handlePermanentDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/members/${deleteTarget.id}/force`);
      toast.success("Member permanently deleted.");
      setDeleteTarget(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget.id);
        return next;
      });
      mutate();
      invalidateDashboard();
      invalidatePayments();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to delete member. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkPermanentDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    try {
      await api.post("/admin/members/bulk-force-delete", { ids: Array.from(selectedIds) });
      toast.success(`${selectedIds.size} member(s) permanently deleted.`);
      setBulkDeleteOpen(false);
      setSelectedIds(new Set());
      mutate();
      invalidateDashboard();
      invalidatePayments();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to delete members. Please try again.");
    } finally {
      setBulkDeleting(false);
    }
  };

  if (!authorized) return null;

  return (
    <>
      <BreadcrumbComp title="Old Students / Members" items={BCrumb} />

      <CardBox className="p-0 bg-background overflow-hidden border-none rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="relative w-full sm:w-64">
            <Icon icon="solar:magnifer-linear" width={18} height={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-darklink" />
            <Input
              placeholder="Search old students..."
              className="pl-10"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-darklink">
              Deleted students are kept here for reference — restore one to make it active again, or delete permanently.
            </p>
            {canDelete && !readOnly && selectedIds.size > 0 && (
              <Button type="button" variant="lighterror" onClick={() => setBulkDeleteOpen(true)}>
                <Icon icon="solar:trash-bin-trash-linear" width={16} height={16} className="mr-1.5" />
                Delete permanently ({selectedIds.size})
              </Button>
            )}
            {selectedIds.size > 0 && (
              <Button type="button" variant="ghost" onClick={() => setSelectedIds(new Set())}>
                Clear selection
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
                <TableHead>Phone</TableHead>
                <TableHead>Deleted On</TableHead>
                <TableHead className="text-right pe-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton columns={5} />
              ) : members?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-sm text-gray-500">No old students found</TableCell>
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
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.member_code}</p>
                      </div>
                    </TableCell>
                    <TableCell>{member.phone}</TableCell>
                    <TableCell>{member.deleted_at ? formatDate(member.deleted_at) : "—"}</TableCell>
                    <TableCell className="text-right pe-6">
                      <div className="flex justify-end gap-2">
                        {canDelete && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestore(member)}
                            disabled={restoringId === member.id || readOnly}
                            className="flex items-center gap-1.5"
                          >
                            <Icon icon="solar:refresh-linear" width={16} height={16} />
                            {restoringId === member.id ? "Restoring..." : "Restore"}
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="lighterror"
                            size="sm"
                            disabled={readOnly}
                            onClick={() => setDeleteTarget(member)}
                            title="Delete permanently"
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

      <DeleteConfirmDialog
        open={!!deleteTarget}
        title={`Permanently delete "${deleteTarget?.name}"?`}
        description="This cannot be undone — all of this student's data will be permanently removed."
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handlePermanentDelete}
      />

      <DeleteConfirmDialog
        open={bulkDeleteOpen}
        title={`Permanently delete ${selectedIds.size} selected member(s)?`}
        description="This cannot be undone — all data for these students will be permanently removed."
        loading={bulkDeleting}
        onCancel={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkPermanentDelete}
      />
    </>
  );
}

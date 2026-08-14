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
import { Icon } from "@iconify/react";
import PaginationBar from "@/components/shared/Pagination";
import TableSkeleton from "@/components/shared/TableSkeleton";
import DeleteConfirmDialog from "@/components/shared/DeleteConfirmDialog";
import { api, ApiError, invalidateDashboard } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/context/ToastContext";
import { usePermissionGuard } from "@/hooks/usePermissionGuard";
import { useReadOnly } from "@/hooks/useReadOnly";
import type { Member, Paginated } from "@/types";

const BCrumb = [{ to: "/", title: "Home" }, { to: "/members", title: "Members / Students" }, { title: "Trash" }];

export default function MembersTrashPage() {
  const { authorized } = usePermissionGuard("members", "delete");
  const readOnly = useReadOnly();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: members, isLoading: loading, error: loadError, mutate } = useApi<Paginated<Member>>(
    "/admin/members/trashed",
    { search: search || undefined, page }
  );
  const error = loadError ? "Unable to load deleted members." : null;

  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleRestore = async (member: Member) => {
    setRestoringId(member.id);
    try {
      await api.post(`/admin/members/${member.id}/restore`);
      toast.success(`${member.name} restored.`);
      mutate();
      invalidateDashboard();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to restore member. Please try again.");
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/members/${deleteTarget.id}/force`);
      toast.success("Member permanently deleted.");
      setDeleteTarget(null);
      mutate();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to delete member. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  if (!authorized) return null;

  return (
    <>
      <BreadcrumbComp title="Trash" items={BCrumb} />

      <CardBox className="p-0 bg-background overflow-hidden border-none rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="relative w-full sm:w-64">
            <Icon icon="solar:magnifer-linear" width={18} height={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-darklink" />
            <Input placeholder="Search deleted members..." className="pl-10" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <p className="text-xs text-darklink">Deleted students land here first — restore them or remove permanently.</p>
        </div>

        {error && <p className="px-6 pb-4 text-sm text-error">{error}</p>}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-6">Member</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Deleted On</TableHead>
                <TableHead className="text-right pe-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton columns={4} />
              ) : members?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-sm text-gray-500">Trash is empty</TableCell>
                </TableRow>
              ) : (
                members?.data.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="ps-6 font-medium">
                      {member.name}
                      <span className="block text-xs text-gray-500">{member.member_code}</span>
                    </TableCell>
                    <TableCell>{member.phone}</TableCell>
                    <TableCell>{member.deleted_at ? new Date(member.deleted_at).toLocaleDateString() : "—"}</TableCell>
                    <TableCell className="text-right pe-6">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={restoringId === member.id || readOnly}
                          onClick={() => handleRestore(member)}
                        >
                          <Icon icon="tabler:restore" width={16} height={16} className="mr-1.5" />
                          {restoringId === member.id ? "Restoring..." : "Restore"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={readOnly}
                          className="text-error hover:bg-error hover:text-white"
                          onClick={() => setDeleteTarget(member)}
                        >
                          <Icon icon="solar:trash-bin-trash-bold" width={16} height={16} />
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

      <DeleteConfirmDialog
        open={!!deleteTarget}
        title={`Permanently delete "${deleteTarget?.name}"?`}
        description="This cannot be undone — all of this student's data will be permanently removed."
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handlePermanentDelete}
      />
    </>
  );
}

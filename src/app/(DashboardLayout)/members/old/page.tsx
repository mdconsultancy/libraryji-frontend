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
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/context/ToastContext";
import { usePermissionGuard } from "@/hooks/usePermissionGuard";
import { usePermission } from "@/hooks/usePermission";
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
  const canRestore = usePermission("members", "delete");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [restoringId, setRestoringId] = useState<number | null>(null);

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
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    } finally {
      setRestoringId(null);
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
          <p className="text-sm text-darklink">
            Deleted students are kept here for reference — restore one to make it active again.
          </p>
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
                  <TableCell colSpan={4} className="text-center py-8 text-sm text-gray-500">No old students found</TableCell>
                </TableRow>
              ) : (
                members?.data.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="ps-6">
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.member_code}</p>
                      </div>
                    </TableCell>
                    <TableCell>{member.phone}</TableCell>
                    <TableCell>{member.deleted_at ? formatDate(member.deleted_at) : "—"}</TableCell>
                    <TableCell className="text-right pe-6">
                      {canRestore && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(member)}
                          disabled={restoringId === member.id}
                          className="flex items-center gap-1.5"
                        >
                          <Icon icon="solar:refresh-linear" width={16} height={16} />
                          {restoringId === member.id ? "Restoring..." : "Restore"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <PaginationBar meta={members ?? null} onPageChange={setPage} />
      </CardBox>
    </>
  );
}

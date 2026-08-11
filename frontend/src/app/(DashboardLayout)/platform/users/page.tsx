"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import PaginationBar from "@/components/shared/Pagination";
import TableSkeleton from "@/components/shared/TableSkeleton";
import DeleteConfirmDialog from "@/components/shared/DeleteConfirmDialog";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/context/ToastContext";
import { api, ApiError } from "@/lib/api";
import type { Paginated, UserManagementRow } from "@/types";

const BCrumb = [{ to: "/", title: "Home" }, { title: "User Management" }];

export default function UserManagementPage() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<UserManagementRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: users, isLoading: loading, error: loadError, mutate } = useApi<Paginated<UserManagementRow>>(
    "/super-admin/users",
    { page, search: search || undefined }
  );
  const error = loadError ? "Unable to load users." : null;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/super-admin/users/${deleteTarget.id}`);
      toast.success(`${deleteTarget.name} has been deleted.`);
      setDeleteTarget(null);
      mutate();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to delete this user. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <BreadcrumbComp title="User Management" items={BCrumb} />

      <CardBox className="p-0 bg-background overflow-hidden border-none rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="relative w-full sm:w-72">
            <Icon icon="solar:magnifer-linear" width={18} height={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-darklink" />
            <Input
              placeholder="Search by name, email, or library..."
              className="pl-10"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {error && <p className="px-6 pb-4 text-sm text-error">{error}</p>}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-6">User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Libraries</TableHead>
                <TableHead>Subscriptions</TableHead>
                <TableHead>DB Storage</TableHead>
                <TableHead>Media Storage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pe-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton columns={8} />
              ) : users?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-sm text-gray-500">No users found</TableCell>
                </TableRow>
              ) : (
                users?.data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="ps-6 font-medium">{row.name}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">
                          {row.tenants_count} {row.tenants_count === 1 ? "library" : "libraries"}
                        </span>
                        <span className="text-xs text-darklink truncate max-w-56">
                          {row.tenants.map((t) => t.name).join(", ") || "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-56">
                        {row.tenants.map((t) => (
                          <Badge key={t.id} variant="secondary" className="border-none text-xs">
                            {t.active_subscription?.plan?.name ?? "No plan"}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{row.db_storage_mb.toLocaleString()} MB</TableCell>
                    <TableCell className="text-sm">{row.media_storage_mb.toLocaleString()} MB</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`border-none capitalize ${row.status === "active" ? "bg-lightsuccess text-success" : "bg-lightsecondary text-secondary"}`}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pe-6">
                      <div className="flex justify-end gap-2">
                        <Link href={`/platform/users/${row.id}`}>
                          <Button variant="outline" size="sm">
                            <Icon icon="solar:eye-linear" width={16} height={16} />
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-error hover:bg-error hover:text-white"
                          onClick={() => setDeleteTarget(row)}
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

        <PaginationBar meta={users ?? null} onPageChange={setPage} />
      </CardBox>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This permanently deletes the user account. Users with active library data (members, seats, halls, staff, or expenses in any of their libraries) can't be deleted — clean up that tenant data first."
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}

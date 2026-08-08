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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@iconify/react";
import PaginationBar from "@/components/shared/Pagination";
import TableSkeleton from "@/components/shared/TableSkeleton";
import { useApi } from "@/hooks/useApi";
import type { Paginated, TenantStatus, UserManagementDetail, UserManagementRow } from "@/types";

const BCrumb = [{ to: "/", title: "Home" }, { title: "User Management" }];

const statusStyles: Record<TenantStatus, string> = {
  trial: "bg-lightwarning text-warning",
  active: "bg-lightsuccess text-success",
  suspended: "bg-lighterror text-error",
  cancelled: "bg-lightsecondary text-secondary",
};

export default function UserManagementPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewingId, setViewingId] = useState<number | null>(null);

  const { data: users, isLoading: loading, error: loadError } = useApi<Paginated<UserManagementRow>>(
    "/super-admin/users",
    { page, search: search || undefined }
  );
  const error = loadError ? "Unable to load users." : null;

  const { data: detail, isLoading: detailLoading } = useApi<UserManagementDetail>(
    viewingId ? `/super-admin/users/${viewingId}` : null
  );

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
                <TableHead>Role</TableHead>
                <TableHead>Libraries</TableHead>
                <TableHead>Subscriptions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pe-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton columns={7} />
              ) : users?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-sm text-gray-500">No users found</TableCell>
                </TableRow>
              ) : (
                users?.data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="ps-6 font-medium">{row.name}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell className="capitalize">Admin</TableCell>
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
                    <TableCell>
                      <Badge variant="secondary" className={`border-none capitalize ${row.status === "active" ? "bg-lightsuccess text-success" : "bg-lightsecondary text-secondary"}`}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pe-6">
                      <Button variant="outline" size="sm" onClick={() => setViewingId(row.id)}>
                        <Icon icon="solar:eye-linear" width={16} height={16} />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <PaginationBar meta={users ?? null} onPageChange={setPage} />
      </CardBox>

      <Dialog open={viewingId !== null} onOpenChange={(v) => !v && setViewingId(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detail?.name ?? "User details"}</DialogTitle>
          </DialogHeader>

          {detailLoading || !detail ? (
            <p className="text-sm text-darklink py-6 text-center">Loading...</p>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-darklink">Email</p>
                  <p className="font-medium">{detail.email}</p>
                </div>
                <div>
                  <p className="text-darklink">Phone</p>
                  <p className="font-medium">{detail.phone ?? "—"}</p>
                </div>
                <div>
                  <p className="text-darklink">Status</p>
                  <Badge variant="secondary" className="border-none capitalize mt-1">{detail.status}</Badge>
                </div>
                <div>
                  <p className="text-darklink">Libraries owned</p>
                  <p className="font-medium">{detail.tenants_count}</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h6 className="font-semibold text-sm">Libraries</h6>
                {detail.tenants.length === 0 && <p className="text-sm text-darklink">No libraries assigned.</p>}
                {detail.tenants.map((tenant) => (
                  <CardBox key={tenant.id} className="p-4 border border-border">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div>
                        <p className="font-medium">{tenant.name}</p>
                        <p className="text-xs text-darklink">
                          Role: <span className="capitalize">{tenant.pivot.role}</span>
                          {tenant.library_code && <> · Code: <span className="font-mono">{tenant.library_code}</span></>}
                        </p>
                      </div>
                      <Badge variant="secondary" className={`border-none capitalize ${statusStyles[tenant.status]}`}>
                        {tenant.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-3">
                      <div className="rounded-lg bg-lightprimary py-2">
                        <p className="text-lg font-semibold">{tenant.halls?.length ?? 0}</p>
                        <p className="text-xs text-darklink">Halls</p>
                      </div>
                      <div className="rounded-lg bg-lightprimary py-2">
                        <p className="text-lg font-semibold">{tenant.seats_count ?? 0}</p>
                        <p className="text-xs text-darklink">Seats</p>
                      </div>
                      <div className="rounded-lg bg-lightprimary py-2">
                        <p className="text-lg font-semibold">{tenant.members_count ?? 0}</p>
                        <p className="text-xs text-darklink">Members</p>
                      </div>
                      <div className="rounded-lg bg-lightprimary py-2">
                        <p className="text-lg font-semibold">{tenant.membership_plans?.length ?? 0}</p>
                        <p className="text-xs text-darklink">Plans</p>
                      </div>
                    </div>

                    <p className="text-xs text-darklink mb-1">Subscription history</p>
                    {tenant.subscriptions && tenant.subscriptions.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {tenant.subscriptions.map((sub) => (
                          <div key={sub.id} className="flex items-center justify-between text-xs">
                            <span>{sub.plan?.name ?? "—"}</span>
                            <span className="capitalize text-darklink">{sub.status}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-darklink">No subscriptions yet.</p>
                    )}
                  </CardBox>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

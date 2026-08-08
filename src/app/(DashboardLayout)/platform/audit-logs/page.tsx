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
import PaginationBar from "@/components/shared/Pagination";
import TableSkeleton from "@/components/shared/TableSkeleton";
import { useApi } from "@/hooks/useApi";
import type { AuditLog, Paginated } from "@/types";

const BCrumb = [{ to: "/", title: "Home" }, { title: "Audit Logs" }];

export default function AuditLogsPage() {
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data: logs, isLoading: loading, error: loadError } = useApi<Paginated<AuditLog>>("/super-admin/audit-logs", {
    page,
    action: actionFilter || undefined,
  });
  const error = loadError ? "Unable to load audit logs." : null;

  return (
    <>
      <BreadcrumbComp title="Audit Logs" items={BCrumb} />

      <CardBox className="p-0 bg-background overflow-hidden border-none rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <Input
            placeholder="Filter by action..."
            className="w-full sm:w-64"
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          />
        </div>

        {error && <p className="px-6 pb-4 text-sm text-error">{error}</p>}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-6">Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead className="pe-6">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton columns={6} />
              ) : logs?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-sm text-gray-500">No audit log entries yet</TableCell>
                </TableRow>
              ) : (
                logs?.data.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="ps-6 font-medium">{log.action}</TableCell>
                    <TableCell>{log.user?.name || "—"}</TableCell>
                    <TableCell>{log.tenant?.name || "—"}</TableCell>
                    <TableCell>{log.auditable_type ? `${log.auditable_type.split('\\').pop()} #${log.auditable_id}` : "—"}</TableCell>
                    <TableCell>{log.ip_address || "—"}</TableCell>
                    <TableCell className="pe-6">{new Date(log.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <PaginationBar meta={logs ?? null} onPageChange={setPage} />
      </CardBox>
    </>
  );
}

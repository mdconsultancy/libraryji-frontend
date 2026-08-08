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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PaginationBar from "@/components/shared/Pagination";
import TableSkeleton from "@/components/shared/TableSkeleton";
import { useApi } from "@/hooks/useApi";
import type { TenantSubscription, TenantSubscriptionStatus, Paginated } from "@/types";

const BCrumb = [{ to: "/", title: "Home" }, { title: "Subscriptions & Payments" }];

const statuses: TenantSubscriptionStatus[] = ["trialing", "active", "past_due", "cancelled", "expired"];

const statusStyles: Record<TenantSubscriptionStatus, string> = {
  trialing: "bg-lightwarning text-warning",
  active: "bg-lightsuccess text-success",
  past_due: "bg-lighterror text-error",
  cancelled: "bg-lightsecondary text-secondary",
  expired: "bg-lighterror text-error",
};

export default function PlatformSubscriptionsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data: subs, isLoading: loading, error: loadError } = useApi<Paginated<TenantSubscription>>("/super-admin/subscriptions", {
    page,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const error = loadError ? "Unable to load subscriptions." : null;

  return (
    <>
      <BreadcrumbComp title="Subscriptions & Payments" items={BCrumb} />

      <CardBox className="p-0 bg-background overflow-hidden border-none rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="w-full sm:w-48">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && <p className="px-6 pb-4 text-sm text-error">{error}</p>}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-6">Invoice</TableHead>
                <TableHead>Library</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="pe-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton columns={7} />
              ) : subs?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-sm text-gray-500">No subscriptions found</TableCell>
                </TableRow>
              ) : (
                subs?.data.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="ps-6 font-medium">{sub.invoice_number || "—"}</TableCell>
                    <TableCell>{sub.tenant?.name || "—"}</TableCell>
                    <TableCell>{sub.plan?.name || "—"}</TableCell>
                    <TableCell>₹{Number(sub.amount).toLocaleString()}</TableCell>
                    <TableCell>{sub.gateway_reference || "—"}</TableCell>
                    <TableCell>{sub.created_at ? new Date(sub.created_at).toLocaleDateString() : "—"}</TableCell>
                    <TableCell className="pe-6">
                      <Badge variant="secondary" className={`border-none capitalize ${statusStyles[sub.status]}`}>
                        {sub.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <PaginationBar meta={subs ?? null} onPageChange={setPage} />
      </CardBox>
    </>
  );
}

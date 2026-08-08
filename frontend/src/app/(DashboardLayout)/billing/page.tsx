"use client";

import { useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Tenant, TenantSubscription, TenantSubscriptionStatus } from "@/types";

const BCrumb = [{ to: "/", title: "Home" }, { title: "Subscription & Billing" }];

const statusStyles: Record<TenantSubscriptionStatus, string> = {
  trialing: "bg-lightwarning text-warning",
  active: "bg-lightsuccess text-success",
  past_due: "bg-lighterror text-error",
  cancelled: "bg-lightsecondary text-secondary",
  expired: "bg-lighterror text-error",
};

export default function BillingPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [subscriptions, setSubscriptions] = useState<TenantSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ tenant: Tenant; subscriptions: TenantSubscription[] }>("/admin/billing")
      .then((data) => {
        setTenant(data.tenant);
        setSubscriptions(data.subscriptions);
      })
      .catch(() => setError("Unable to load billing information."))
      .finally(() => setLoading(false));
  }, []);

  const active = tenant?.active_subscription;

  return (
    <>
      <BreadcrumbComp title="Subscription & Billing" items={BCrumb} />

      {loading ? (
        <div className="text-center py-20 text-link dark:text-darklink">Loading...</div>
      ) : error ? (
        <p className="text-sm text-error">{error}</p>
      ) : (
        <div className="flex flex-col gap-6">
          <CardBox className="p-6 bg-background border-none rounded-xl shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h5 className="card-title mb-2">Current Plan</h5>
                {active ? (
                  <>
                    <p className="text-xl font-semibold">{active.plan?.name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      ₹{Number(active.amount).toLocaleString()} · renews {active.ends_at ? new Date(active.ends_at).toLocaleDateString() : "—"}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">No active subscription.</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-3">
                {active && (
                  <Badge variant="secondary" className={`border-none capitalize ${statusStyles[active.status]}`}>
                    {active.status.replace('_', ' ')}
                  </Badge>
                )}
                <Button asChild variant="outline" className="flex items-center gap-1.5">
                  <Link href="/select-plan">
                    <Icon icon="tabler:refresh" width={16} height={16} />
                    Change / Renew Plan
                  </Link>
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Plan changes and renewals are handled through secure Razorpay checkout — subscriptions cannot be created manually.
            </p>
          </CardBox>

          <CardBox className="p-0 bg-background overflow-hidden border-none rounded-xl shadow-xs">
            <h5 className="card-title p-6 pb-0">Payment History</h5>
            <div className="overflow-x-auto mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="ps-6">Invoice</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead className="pe-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-sm text-gray-500">
                        No payment history yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    subscriptions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="ps-6 font-medium">{sub.invoice_number || "—"}</TableCell>
                        <TableCell>{sub.plan?.name || "—"}</TableCell>
                        <TableCell>₹{Number(sub.amount).toLocaleString()}</TableCell>
                        <TableCell>{sub.gateway_reference || "—"}</TableCell>
                        <TableCell>{new Date(sub.starts_at).toLocaleDateString()}</TableCell>
                        <TableCell>{sub.ends_at ? new Date(sub.ends_at).toLocaleDateString() : "—"}</TableCell>
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
          </CardBox>
        </div>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BreadcrumbComp from "@/app/(DashboardLayout)/layout/shared/breadcrumb/BreadcrumbComp";
import CardBox from "@/app/components/shared/CardBox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Icon } from "@iconify/react";
import { useApi } from "@/hooks/useApi";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import type { TenantStatus, UserManagementDetail } from "@/types";
import { DetailSkeleton, ListSkeleton } from "@/components/shared/skeletons";

const statusStyles: Record<TenantStatus, string> = {
  trial: "bg-lightwarning text-warning",
  active: "bg-lightsuccess text-success",
  suspended: "bg-lighterror text-error",
  cancelled: "bg-lightsecondary text-secondary",
};

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-lightprimary py-3 px-2 text-center">
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-darklink">{label}</p>
    </div>
  );
}

export default function UserManagementDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { data: detail, isLoading, error: loadError } = useApi<UserManagementDetail>(
    `/super-admin/users/${params.id}`
  );
  const error = loadError ? "Unable to load this user." : null;

  // Direct Change Password
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!detail) return;
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Password and confirm password must match.");
      return;
    }
    setChangingPassword(true);
    try {
      const res = await api.post<{ message: string }>(`/super-admin/users/${detail.id}/change-password`, {
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      toast.success(res.message || "Password updated successfully.");
      setPasswordModalOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to change password.");
    } finally {
      setChangingPassword(false);
    }
  };

  const BCrumb = [
    { to: "/dashboard", title: "Home" },
    { to: "/platform/users", title: "User Management" },
    { title: detail?.name ?? "User" },
  ];

  return (
    <>
      <BreadcrumbComp title={detail?.name ?? "User Detail"} items={BCrumb} />

      <Button variant="outline" size="sm" className="mb-4 flex items-center gap-1.5" onClick={() => router.push("/platform/users")}>
        <Icon icon="tabler:arrow-left" width={16} height={16} />
        Back to User Management
      </Button>

      {error && <p className="text-sm text-error">{error}</p>}

      {isLoading || !detail ? (
        <div className="flex flex-col gap-6">
          <CardBox className="p-6">
            <DetailSkeleton rows={6} />
          </CardBox>
          <CardBox className="p-6">
            <ListSkeleton rows={4} />
          </CardBox>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <CardBox className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm flex-1">
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
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6 max-w-md">
              <StatTile label="Total DB Storage" value={`${detail.db_storage_mb.toLocaleString()} MB`} />
              <StatTile label="Total Media Storage" value={`${detail.media_storage_mb.toLocaleString()} MB`} />
            </div>
          </CardBox>

          <CardBox className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Icon icon="tabler:key" width={18} height={18} className="text-primary" />
                  <h6 className="font-semibold text-sm">Security & Password</h6>
                </div>
                <p className="text-xs text-darklink">
                  Super Admin can directly set a new password for this user without email codes.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                className="flex items-center gap-1.5 bg-primary text-white"
                onClick={() => {
                  setNewPassword("");
                  setConfirmPassword("");
                  setPasswordModalOpen(true);
                }}
              >
                <Icon icon="tabler:lock" width={16} height={16} />
                Change Password
              </Button>
            </div>
          </CardBox>

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

                {(tenant as any).data_cleaned_at ? (
                  <div className="rounded-lg bg-lightwarning p-2.5 text-xs text-warning flex items-center gap-2 mb-3 border border-warning/30">
                    <Icon icon="tabler:alert-triangle" width={16} height={16} className="shrink-0" />
                    <span>
                      <strong>Library data was erased:</strong> {new Date((tenant as any).data_cleaned_at).toLocaleString()} by {(tenant as any).data_cleaned_by_name || "Admin"}
                    </span>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  <StatTile label="Seats" value={tenant.seats_count ?? 0} />
                  <StatTile label="Members" value={tenant.members_count ?? 0} />
                  <StatTile
                    label="Expenses"
                    value={`${tenant.expenses_count ?? 0} (₹${Number(tenant.expenses_sum_amount ?? 0).toLocaleString()})`}
                  />
                  <StatTile label="Halls" value={tenant.halls?.length ?? 0} />
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3 max-w-sm">
                  <StatTile label="DB Storage" value={`${tenant.db_storage_mb.toLocaleString()} MB`} />
                  <StatTile label="Media Storage" value={`${tenant.media_storage_mb.toLocaleString()} MB`} />
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

      {/* Direct Change Password Modal */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change User Password</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4">
            <p className="text-xs text-gray-500">
              Enter a new password for <span className="font-semibold text-dark">{detail?.name}</span>.
            </p>
            <div className="flex flex-col gap-2">
              <Label htmlFor="super-new-password">New Password</Label>
              <Input
                id="super-new-password"
                type="password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="super-confirm-password">Confirm New Password</Label>
              <Input
                id="super-confirm-password"
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setPasswordModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-white"
              onClick={handleChangePassword}
              disabled={changingPassword}
            >
              {changingPassword ? "Updating..." : "Update Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

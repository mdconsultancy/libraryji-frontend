"use client";

import { useEffect, useState, FormEvent } from "react";
import BreadcrumbComp from "@/app/(DashboardLayout)/layout/shared/breadcrumb/BreadcrumbComp";
import CardBox from "@/app/components/shared/CardBox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { useToast } from "@/context/ToastContext";
import type { Tenant } from "@/types";

const BCrumb = [{ to: "/", title: "Home" }, { title: "Library Settings" }];

export default function TenantSettingsPage() {
  const { authorized } = useRoleGuard(["admin"]);
  const toast = useToast();
  const { data: tenant, isLoading: loading, mutate } = useApi<Tenant>("/admin/tenant-settings");
  const [form, setForm] = useState({ name: "", phone: "", timezone: "" });
  const [formInitialized, setFormInitialized] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (tenant && !formInitialized) {
      setForm({ name: tenant.name, phone: tenant.phone || "", timezone: tenant.timezone || "" });
      setFormInitialized(true);
    }
  }, [tenant, formInitialized]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    setSaved(false);
    try {
      const data = await api.put<Tenant>("/admin/tenant-settings", form);
      mutate(data, { revalidate: false });
      setSaved(true);
    } catch (err) {
      if (err instanceof ApiError) setFieldErrors(err.errors || {});
    } finally {
      setSaving(false);
    }
  };

  const fieldError = (field: string) => fieldErrors[field]?.[0];

  if (!authorized) return null;

  if (loading) {
    return <div className="text-center py-20 text-link dark:text-darklink">Loading...</div>;
  }

  return (
    <>
      <BreadcrumbComp title="Library Settings" items={BCrumb} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CardBox className="p-6 bg-background border-none rounded-xl shadow-xs">
          <h5 className="card-title mb-6">Library Information</h5>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-gray-500">Library Code</p>
              {tenant?.library_code ? (
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-semibold tracking-wider bg-lightprimary text-primary px-2 py-0.5 rounded">
                    {tenant.library_code}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(tenant.library_code!);
                      toast.success("Library Code copied to clipboard.");
                    }}
                    className="text-darklink hover:text-primary"
                    aria-label="Copy library code"
                  >
                    <Icon icon="tabler:copy" width={16} height={16} />
                  </button>
                </div>
              ) : (
                <p>—</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Share this with your staff — they need it to log in.</p>
            </div>
            <div><p className="text-xs text-gray-500">Established Year</p><p>{tenant?.established_year || "—"}</p></div>
            <div><p className="text-xs text-gray-500">Email</p><p>{tenant?.email}</p></div>
            <div><p className="text-xs text-gray-500">Address</p><p>{tenant?.address || "—"}</p></div>
            <div><p className="text-xs text-gray-500">City</p><p>{tenant?.city || "—"}</p></div>
            <div><p className="text-xs text-gray-500">State</p><p>{tenant?.state || "—"}</p></div>
            <div><p className="text-xs text-gray-500">GST Number</p><p>{tenant?.gst_number || "—"}</p></div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <Badge variant="secondary" className={`border-none capitalize mt-1 ${tenant?.status === 'active' ? 'bg-lightsuccess text-success' : 'bg-lightwarning text-warning'}`}>
                {tenant?.status}
              </Badge>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            To update address, GST, or other details not editable here, please contact support.
          </p>
        </CardBox>

        <CardBox className="p-6 bg-background border-none rounded-xl shadow-xs">
          <h5 className="card-title mb-6">Editable Settings</h5>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
            {saved && <p className="text-sm text-success">Settings saved.</p>}
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Library Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              {fieldError("name") && <p className="text-xs text-error">{fieldError("name")}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              {fieldError("phone") && <p className="text-xs text-error">{fieldError("phone")}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input id="timezone" placeholder="e.g. Asia/Kolkata" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
              {fieldError("timezone") && <p className="text-xs text-error">{fieldError("timezone")}</p>}
            </div>
            <div className="flex justify-end">
              <Button type="submit" className="flex items-center gap-1.5" disabled={saving}>
                <Icon icon="tabler:device-floppy" width={18} height={18} />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardBox>
      </div>
    </>
  );
}

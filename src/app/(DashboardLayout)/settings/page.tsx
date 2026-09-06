"use client";

import { useEffect, useState, FormEvent } from "react";
import BreadcrumbComp from "@/app/(DashboardLayout)/layout/shared/breadcrumb/BreadcrumbComp";
import CardBox from "@/app/components/shared/CardBox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Icon } from "@iconify/react";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { usePermissionGuard } from "@/hooks/usePermissionGuard";
import { usePermission } from "@/hooks/usePermission";
import { useToast } from "@/context/ToastContext";
import type { Tenant } from "@/types";
import BackupManagement from "./BackupManagement";
import DangerZone from "@/app/components/user-profile/DangerZone";

const BCrumb = [{ to: "/dashboard", title: "Home" }, { title: "Library" }];

export default function TenantSettingsPage() {
  const { authorized } = usePermissionGuard("library", "view");
  const canEdit = usePermission("library", "edit");
  const toast = useToast();
  const { data: tenant, isLoading: loading, mutate } = useApi<Tenant>("/admin/tenant-settings");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    timezone: "",
    established_year: "",
    address: "",
    city: "",
    state: "",
    gst_number: "",
  });
  const [formInitialized, setFormInitialized] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (tenant && !formInitialized) {
      setForm({
        name: tenant.name,
        email: tenant.email || "",
        phone: tenant.phone || "",
        timezone: tenant.timezone || "",
        established_year: tenant.established_year ? String(tenant.established_year) : "",
        address: tenant.address || "",
        city: tenant.city || "",
        state: tenant.state || "",
        gst_number: tenant.gst_number || "",
      });
      setFormInitialized(true);
    }
  }, [tenant, formInitialized]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    setSaved(false);
    try {
      const payload = {
        ...form,
        established_year: form.established_year ? Number(form.established_year) : null,
      };
      const data = await api.put<Tenant>("/admin/tenant-settings", payload);
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
      <BreadcrumbComp title="Library" items={BCrumb} />

      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">Library Information</TabsTrigger>
          <TabsTrigger value="backup">Data Export</TabsTrigger>
          <TabsTrigger value="danger" className="text-error data-[state=active]:text-error">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
      <div className="grid grid-cols-1 gap-6">
        <CardBox className="p-6 bg-background border-none rounded-xl shadow-xs">
          <h5 className="card-title mb-6">Library Information</h5>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
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
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <Badge variant="secondary" className={`border-none capitalize mt-1 ${tenant?.status === 'active' ? 'bg-lightsuccess text-success' : 'bg-lightwarning text-warning'}`}>
                {tenant?.status}
              </Badge>
            </div>
          </div>

          {canEdit ? (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {saved && <p className="text-sm text-success sm:col-span-2">Settings saved.</p>}
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Library Name</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                {fieldError("name") && <p className="text-xs text-error">{fieldError("name")}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                {fieldError("email") && <p className="text-xs text-error">{fieldError("email")}</p>}
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
              <div className="flex flex-col gap-2">
                <Label htmlFor="established_year">Established Year</Label>
                <Input id="established_year" type="number" value={form.established_year} onChange={(e) => setForm({ ...form, established_year: e.target.value })} />
                {fieldError("established_year") && <p className="text-xs text-error">{fieldError("established_year")}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="gst_number">GST Number</Label>
                <Input id="gst_number" value={form.gst_number} onChange={(e) => setForm({ ...form, gst_number: e.target.value })} />
                {fieldError("gst_number") && <p className="text-xs text-error">{fieldError("gst_number")}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                {fieldError("city") && <p className="text-xs text-error">{fieldError("city")}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                {fieldError("state") && <p className="text-xs text-error">{fieldError("state")}</p>}
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                {fieldError("address") && <p className="text-xs text-error">{fieldError("address")}</p>}
              </div>
              <div className="flex justify-end sm:col-span-2">
                <Button type="submit" className="flex items-center gap-1.5" disabled={saving}>
                  <Icon icon="tabler:device-floppy" width={18} height={18} />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div><p className="text-xs text-gray-500">Library Name</p><p>{tenant?.name}</p></div>
              <div><p className="text-xs text-gray-500">Email</p><p>{tenant?.email || "—"}</p></div>
              <div><p className="text-xs text-gray-500">Phone</p><p>{tenant?.phone || "—"}</p></div>
              <div><p className="text-xs text-gray-500">Timezone</p><p>{tenant?.timezone || "—"}</p></div>
              <div><p className="text-xs text-gray-500">Established Year</p><p>{tenant?.established_year || "—"}</p></div>
              <div><p className="text-xs text-gray-500">GST Number</p><p>{tenant?.gst_number || "—"}</p></div>
              <div><p className="text-xs text-gray-500">City</p><p>{tenant?.city || "—"}</p></div>
              <div><p className="text-xs text-gray-500">State</p><p>{tenant?.state || "—"}</p></div>
              <div className="sm:col-span-2"><p className="text-xs text-gray-500">Address</p><p>{tenant?.address || "—"}</p></div>
            </div>
          )}
        </CardBox>
      </div>
        </TabsContent>

        <TabsContent value="backup">
          <BackupManagement />
        </TabsContent>

        <TabsContent value="danger">
          <DangerZone />
        </TabsContent>
      </Tabs>
    </>
  );
}

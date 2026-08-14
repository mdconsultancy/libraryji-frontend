"use client";
import { useState, FormEvent } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError, invalidateDashboard } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import type { DashboardSummary } from "@/types";

/**
 * Total-inquiries stat + a one-tap "add inquiry" form, backed by the
 * existing Leads module (Lead === "Inquiry" for dashboard purposes — no
 * separate table). Posting here updates the dashboard's own inquiry count
 * immediately via invalidateDashboard(), the same pattern used after a
 * member/staff delete.
 */
export default function InquiryCard({ summary }: { summary: DashboardSummary | null }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/admin/leads", { name, phone });
      toast.success("Inquiry added.");
      setName("");
      setPhone("");
      setOpen(false);
      invalidateDashboard();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to add inquiry. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl h-full shadow-xs bg-white dark:bg-darkgray p-6 relative w-full">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h5 className="card-title">Inquiries</h5>
        <Link href="/leads" className="text-xs text-primary hover:underline">
          View all
        </Link>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="h-12 w-12 rounded-full bg-lightprimary flex items-center justify-center shrink-0">
          <Icon icon="solar:chat-round-line-bold-duotone" width={24} height={24} className="text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">{summary?.total_inquiries ?? 0}</p>
          <p className="text-xs text-darklink mt-1">Total Inquiries · {summary?.today_inquiries ?? 0} today</p>
        </div>
      </div>

      {open ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <div className="flex gap-2 mt-1">
            <Button type="submit" size="sm" disabled={saving} className="flex-1">
              {saving ? "Adding..." : "Add"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button type="button" size="sm" variant="outline" className="w-full" onClick={() => setOpen(true)}>
          <Icon icon="solar:add-circle-linear" width={16} height={16} className="mr-1.5" />
          Add Inquiry
        </Button>
      )}
    </div>
  );
}

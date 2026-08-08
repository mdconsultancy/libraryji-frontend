"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
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
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";

interface LibrariesSummary {
  used: number;
  limit: number | null;
  remaining: number | null;
  exceeded: boolean;
}

const emptyForm = { library_name: "", library_code: "", email: "", phone: "" };

/**
 * Admin-only "Libraries X/Y" indicator next to the Library Switcher. Under
 * the limit, a + button opens a small form to add another Library (which
 * then needs its own payment, same as a fresh registration); at the limit,
 * it becomes an Upgrade Plan link instead — enforcement itself lives on
 * the backend (POST /admin/libraries 422s past the limit regardless of
 * this UI), this is just what steers the admin there.
 */
const LibraryUsage = () => {
  const { user, refreshMe } = useAuth();
  const isAdmin = user?.role === "admin";
  const { data: summary, mutate } = useApi<LibrariesSummary>(isAdmin ? "/admin/libraries-summary" : null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  if (!isAdmin || !summary) return null;

  const openCreate = () => {
    setForm(emptyForm);
    setFieldErrors({});
    setDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    try {
      await api.post("/admin/libraries", {
        library_name: form.library_name,
        library_code: form.library_code || undefined,
        email: form.email,
        phone: form.phone,
      });
      await refreshMe();
      mutate();
      // The new Library is now the current workspace (set server-side) and
      // needs its own payment before anything else works there — same hard
      // navigation reasoning as switching libraries: SWR's cache isn't
      // per-tenant, so this also clears out whatever the previous
      // workspace had cached.
      window.location.href = "/select-plan";
    } catch (err) {
      if (err instanceof ApiError) setFieldErrors(err.errors || {});
    } finally {
      setSaving(false);
    }
  };

  const fieldError = (field: string) => fieldErrors[field]?.[0];
  const limitLabel = summary.limit === null ? "∞" : summary.limit;

  return (
    <>
      <div className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-border text-sm">
        <Icon icon="solar:buildings-3-linear" width={16} height={16} />
        <span>
          {summary.used}/{limitLabel} Libraries
        </span>
        {summary.exceeded ? (
          <Button asChild size="sm" variant="ghost" className="h-6 px-2 text-primary">
            <Link href="/select-plan?upgrade=1">Upgrade Plan</Link>
          </Button>
        ) : (
          <button
            type="button"
            onClick={openCreate}
            aria-label="Add another library"
            className="text-primary hover:text-primaryemphasis"
          >
            <Icon icon="solar:add-circle-linear" width={18} height={18} />
          </button>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Another Library</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="library_name">Library Name *</Label>
              <Input id="library_name" value={form.library_name} onChange={(e) => setForm({ ...form, library_name: e.target.value })} required />
              {fieldError("library_name") && <p className="text-xs text-error">{fieldError("library_name")}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="library_code">Library Code (optional, auto-generated if blank)</Label>
              <Input id="library_code" value={form.library_code} onChange={(e) => setForm({ ...form, library_code: e.target.value.toUpperCase() })} className="uppercase" />
              {fieldError("library_code") && <p className="text-xs text-error">{fieldError("library_code")}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lib_email">Library Email *</Label>
              <Input id="lib_email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              {fieldError("email") && <p className="text-xs text-error">{fieldError("email")}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lib_phone">Library Phone *</Label>
              <Input id="lib_phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
              {fieldError("phone") && <p className="text-xs text-error">{fieldError("phone")}</p>}
            </div>
            <p className="text-xs text-darklink">
              You&apos;ll be taken to plan selection to activate this library right after it&apos;s created.
            </p>

            <DialogFooter className="flex gap-2 mt-4">
              <Button type="submit" className="rounded-md" disabled={saving}>
                {saving ? "Creating..." : "Create & Continue to Payment"}
              </Button>
              <Button type="button" variant="outline" className="rounded-md" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LibraryUsage;

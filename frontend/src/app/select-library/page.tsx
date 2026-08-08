"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FullLogo from "@/app/(DashboardLayout)/layout/shared/logo/FullLogo";
import CardBox from "@/app/components/shared/CardBox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";

/**
 * Library/workspace picker for a multi-library admin. Reached either right
 * after a login that returned `needs_library_selection`, or whenever the
 * dashboard layout guard notices `current_tenant_id` is still null (e.g. a
 * refresh mid-selection). Staff never lands here — it always has exactly
 * one Library and current_tenant_id is set automatically at creation.
 */
export default function SelectLibraryPage() {
  const { user, loading, selectLibrary, logout } = useAuth();
  const router = useRouter();
  const [selectingId, setSelectingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    // Nothing to pick here — already resolved, or not a multi-library admin.
    if (user.current_tenant_id || user.role !== "admin") {
      router.replace("/");
    }
  }, [loading, user, router]);

  const handleSelect = async (tenantId: number) => {
    setSelectingId(tenantId);
    setError(null);
    try {
      await selectLibrary(tenantId);
      // Hard navigation, not router.push: the SWR cache is a single
      // in-memory store keyed by API path (not per-tenant), so anything
      // fetched under the old workspace must be dropped, not just re-routed.
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to switch to that library. Please try again.");
      setSelectingId(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  if (loading || !user) {
    return <div className="h-screen w-full flex items-center justify-center">Loading...</div>;
  }

  const libraries = user.tenants ?? [];

  return (
    <div className="min-h-screen w-full bg-lightprimary py-10 px-4">
      <div className="flex justify-center mb-4">
        <FullLogo />
      </div>
      <div className="max-w-xl mx-auto text-center mb-8">
        <h4 className="text-xl font-semibold mb-2">Choose a library</h4>
        <p className="text-sm text-charcoal">
          You manage more than one library. Pick which one you&apos;d like to work in — you can switch anytime.
        </p>
      </div>

      {error && <p className="text-center text-sm text-error mb-4">{error}</p>}

      <div className="max-w-xl mx-auto flex flex-col gap-3">
        {libraries.map((tenant) => (
          <CardBox key={tenant.id} className="p-4 flex items-center justify-between gap-4">
            <div className="text-left">
              <p className="font-medium">{tenant.name}</p>
              <div className="flex items-center gap-2 mt-1">
                {tenant.library_code && (
                  <span className="font-mono text-xs tracking-wider bg-lightprimary text-primary px-1.5 py-0.5 rounded">
                    {tenant.library_code}
                  </span>
                )}
                <Badge variant="secondary" className="border-none capitalize text-xs">
                  {tenant.status}
                </Badge>
              </div>
            </div>
            <Button onClick={() => handleSelect(tenant.id)} disabled={selectingId !== null} className="flex items-center gap-1.5">
              {selectingId === tenant.id ? (
                "Opening..."
              ) : (
                <>
                  Open
                  <Icon icon="tabler:arrow-right" width={16} height={16} />
                </>
              )}
            </Button>
          </CardBox>
        ))}
      </div>

      <div className="text-center mt-8">
        <Button variant="outline" onClick={handleLogout} className="flex items-center gap-1.5 mx-auto">
          <Icon icon="tabler:logout" width={18} height={18} />
          Logout
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@iconify/react";
import { useAuth } from "@/context/AuthContext";
import GlobalPreloader from "@/components/shared/GlobalPreloader";

/**
 * Current-Library name, always visible for an admin (even with just one
 * Library — so it's never ambiguous which workspace is active), becoming
 * an actual switcher dropdown once there's more than one to choose from.
 * Hidden entirely for staff (always exactly one Library, never a chooser)
 * — matching the backend, which rejects a select-library call from anyone
 * but an admin regardless of what's sent.
 */
const LibrarySwitcher = () => {
  const { user, selectLibrary } = useAuth();
  const [switchingId, setSwitchingId] = useState<number | null>(null);

  if (user?.role !== "admin" || !user.tenants || user.tenants.length === 0) {
    return null;
  }

  const current = user.tenants.find((t) => t.id === user.current_tenant_id);

  if (user.tenants.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border text-sm max-w-48">
        <Icon icon="solar:buildings-3-linear" width={18} height={18} className="shrink-0" />
        <span className="truncate">{current?.name ?? "—"}</span>
      </div>
    );
  }

  const handleSwitch = async (tenantId: number) => {
    if (tenantId === user.current_tenant_id) return;
    setSwitchingId(tenantId);
    try {
      await selectLibrary(tenantId);
      // Hard reload, not a client-side route change: the SWR cache is one
      // in-memory store keyed by API path (not per-tenant), so everything
      // fetched under the old Library has to be dropped and every
      // Library-specific screen re-fetched from scratch under the new one.
      window.location.href = "/";
    } catch {
      setSwitchingId(null);
    }
  };

  return (
    <>
      {switchingId !== null && <GlobalPreloader />}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 rounded-md border border-border hover:bg-lightprimary hover:text-primary text-sm max-w-48"
          >
            <Icon icon="solar:buildings-3-linear" width={18} height={18} className="shrink-0" />
            <span className="truncate">{current?.name ?? "Select library"}</span>
            <Icon icon="tabler:chevron-down" width={14} height={14} className="shrink-0" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64 rounded-sm shadow-md p-2">
          <DropdownMenuLabel className="text-xs text-darklink font-normal">Your libraries</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {user.tenants.map((tenant) => (
            <DropdownMenuItem
              key={tenant.id}
              className="flex items-center justify-between gap-2 px-3 py-2 cursor-pointer"
              disabled={switchingId !== null}
              onClick={() => handleSwitch(tenant.id)}
            >
              <span className="truncate">{tenant.name}</span>
              {tenant.id === user.current_tenant_id && (
                <Icon icon="tabler:check" width={16} height={16} className="text-primary shrink-0" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default LibrarySwitcher;

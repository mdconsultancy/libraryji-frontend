"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import type { PermissionAction, PermissionModule } from "@/types";

/**
 * Redirects away from a page if the current user lacks `view` (or whichever
 * action) on `module` in their current Library. Pairs with usePermission for
 * button-level gating within a page that already passed this check.
 */
export function usePermissionGuard(module: PermissionModule, action: PermissionAction = "view") {
  const { user, loading } = useAuth();
  const router = useRouter();
  const allowed = usePermission(module, action);
  const authorized = loading ? true : !!user && allowed;

  useEffect(() => {
    if (!loading && user && !allowed) {
      router.replace("/");
    }
  }, [loading, user, allowed, router]);

  return { authorized, loading };
}

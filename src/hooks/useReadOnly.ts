"use client";

import { useAuth } from "@/context/AuthContext";
import { tenantIsReadOnly } from "@/lib/tenant";

/** True when the current tenant's trial has expired and only reads are
 *  allowed — gate "Add"/"Edit"/"Delete"/"Mark" buttons with this so the UI
 *  doesn't offer actions the backend will 402 anyway. */
export function useReadOnly(): boolean {
  const { user } = useAuth();
  if (user?.role === "super_admin") return false;
  return tenantIsReadOnly(user?.current_tenant);
}

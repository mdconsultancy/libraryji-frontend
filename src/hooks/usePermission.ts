"use client";

import { useAuth } from "@/context/AuthContext";
import type { PermissionAction, PermissionModule } from "@/types";

/**
 * Whether the logged-in user can perform `action` on `module` in their
 * *current* Library. Mirrors the backend's EnsurePermission middleware:
 * admin/super_admin are always allowed; staff is gated by whatever was
 * configured on their tenant_user row for this Library (a flat array of
 * "module.action" keys — see App\Support\Permissions). This only controls
 * what the UI shows — the API enforces the same rule independently, so
 * hiding a button here is a UX nicety, not the actual security boundary.
 */
export function usePermission(module: PermissionModule, action: PermissionAction): boolean {
  const { user } = useAuth();

  if (!user) return false;
  if (user.role === "admin" || user.role === "super_admin") return true;
  if (user.role !== "staff") return false;

  const membership = user.tenants?.find((t) => t.id === user.current_tenant_id);
  const rawPerms = membership?.pivot?.permissions;
  if (!rawPerms) return false;

  let perms: string[] = [];
  if (Array.isArray(rawPerms)) {
    perms = rawPerms;
  } else if (typeof rawPerms === "string") {
    try {
      perms = JSON.parse(rawPerms);
    } catch {
      perms = [];
    }
  }

  return Array.isArray(perms) && perms.includes(`${module}.${action}`);
}

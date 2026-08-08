"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types";

/** Redirects away from a page if the current user's role isn't in `allowed`. */
export function useRoleGuard(allowed: UserRole[]) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const authorized = !!user && allowed.includes(user.role);

  useEffect(() => {
    if (!loading && user && !authorized) {
      router.replace("/");
    }
  }, [loading, user, authorized, router]);

  return { authorized: loading ? true : authorized, loading };
}

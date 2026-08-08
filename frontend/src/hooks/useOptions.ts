"use client";

import { useApi } from "@/hooks/useApi";
import type { Hall, Shift, MembershipPlan, Member, Seat, Paginated } from "@/types";

export function useHallOptions() {
  const { data } = useApi<Hall[]>("/admin/halls");
  return data ?? [];
}

export function useShiftOptions() {
  const { data } = useApi<Shift[]>("/admin/shifts");
  return data ?? [];
}

export function useMembershipPlanOptions() {
  const { data } = useApi<MembershipPlan[]>("/admin/membership-plans");
  return data ?? [];
}

export function useMemberOptions(search?: string) {
  const params: Record<string, string | number> = { per_page: 50 };
  if (search) params.search = search;
  const { data } = useApi<Paginated<Member>>("/admin/members", params);
  return data?.data ?? [];
}

export function useAvailableSeatOptions(includeSeatId?: number | null) {
  const { data } = useApi<Seat[]>("/admin/seats");
  return (data ?? []).filter((s) => s.status === "available" || s.id === includeSeatId);
}

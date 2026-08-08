"use client";

import { useApi } from "@/hooks/useApi";
import type { PlanLimitResource, PlanLimitSummary } from "@/types";

/**
 * Limit + current usage for one plan-limited resource (seats/members/staff),
 * so a list page can disable its "Add" button proactively instead of only finding
 * out via a 422 after the user has already filled out the create form.
 */
export function usePlanLimit(resource: PlanLimitResource) {
  const { data, mutate } = useApi<PlanLimitSummary>("/admin/plan-limits");
  const entry = data?.[resource];

  return {
    limit: entry?.limit ?? null,
    used: entry?.used ?? 0,
    exceeded: entry?.exceeded ?? false,
    /** Call after successfully creating one, so the count updates immediately. */
    refresh: mutate,
  };
}

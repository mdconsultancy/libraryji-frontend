import type { PlanFeature } from "@/types";

/** Older plans stored `features` as plain strings (always included) — this normalizes either shape to PlanFeature[]. */
export function normalizePlanFeatures(features: (string | PlanFeature)[] | null | undefined): PlanFeature[] {
  if (!features) return [];
  return features
    .map((f) => (typeof f === "string" ? { text: f, included: true } : { text: f.text, included: f.included !== false }))
    .filter((f) => f.text.trim() !== "");
}

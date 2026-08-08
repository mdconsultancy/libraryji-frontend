"use client";

import useSWR, { type SWRConfiguration } from "swr";
import { useMemo } from "react";

/**
 * Cached GET request. `params` are folded into the SWR key so different
 * filters/pages get their own cache entry, while the same key anywhere in the
 * app (any page, any remount) reuses the already-fetched data instantly.
 */
export function useApi<T>(
  path: string | null,
  params?: Record<string, string | number | boolean | undefined | null>,
  options?: SWRConfiguration
) {
  const key = useMemo(() => {
    if (!path) return null;
    if (!params) return path;
    const clean = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
    if (clean.length === 0) return path;
    const qs = new URLSearchParams(clean.map(([k, v]) => [k, String(v)])).toString();
    return `${path}?${qs}`;
  }, [path, params]);

  const { data, error, isLoading, isValidating, mutate } = useSWR<T>(key, options);

  return { data, error, isLoading, isValidating, mutate };
}

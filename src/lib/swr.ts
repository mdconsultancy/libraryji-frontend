// Shared SWR config: one in-memory cache for the whole app session, keyed by API path.
// Once any component fetches a key, every other component (any page, any navigation)
// reads the same cached value instantly instead of firing a new request.

import { api } from '@/lib/api'

export const swrFetcher = <T>(path: string) => api.get<T>(path)

export const swrConfig = {
  fetcher: swrFetcher,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  revalidateIfStale: true,
  refreshInterval: 4_000, // Live auto-sync every 4 seconds across all active views
  refreshWhenHidden: false, // Save bandwidth & battery when browser tab is inactive
  refreshWhenOffline: false,
  dedupingInterval: 2_000,
  focusThrottleInterval: 3_000,
  keepPreviousData: true,
  errorRetryCount: 2,
}

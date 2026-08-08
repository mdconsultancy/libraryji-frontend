// Shared SWR config: one in-memory cache for the whole app session, keyed by API path.
// Once any component fetches a key, every other component (any page, any navigation)
// reads the same cached value instantly instead of firing a new request.

import { api } from '@/lib/api'

export const swrFetcher = <T>(path: string) => api.get<T>(path)

export const swrConfig = {
  fetcher: swrFetcher,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateIfStale: false,
  dedupingInterval: 60_000,
  focusThrottleInterval: 60_000,
  keepPreviousData: true,
  errorRetryCount: 2,
}

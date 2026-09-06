// Shared SWR config: one in-memory cache for the whole app session, keyed by API path.
// Once any component fetches a key, every other component (any page, any navigation)
// reads the same cached value instantly instead of firing a new request.

import { api } from '@/lib/api'

export const swrFetcher = <T>(path: string) => api.get<T>(path)

// No global refreshInterval here — it used to be 4_000, applied to *every*
// useApi()/useSWR() call app-wide with no way to opt out, including the
// public pre-login screens (the "/theme" branding + Google-login-enabled
// check on the Login page was silently re-fetching every 4 seconds forever,
// which is what made it look like it kept "loading/refreshing" on its own).
// Live auto-sync is still genuinely useful on a few shared, multi-device
// screens (Seats, Dashboard, Attendance roster) — those opt in explicitly
// via `{ refreshInterval: LIVE_REFRESH_INTERVAL_MS }` on their own useApi()
// call instead of every screen in the app paying for it by default.
export const LIVE_REFRESH_INTERVAL_MS = 5_000

export const swrConfig = {
  fetcher: swrFetcher,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  revalidateIfStale: true,
  refreshWhenHidden: false, // Save bandwidth & battery when browser tab is inactive
  refreshWhenOffline: false,
  dedupingInterval: 2_000,
  focusThrottleInterval: 3_000,
  keepPreviousData: true,
  errorRetryCount: 2,
}

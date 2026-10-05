// Thin fetch wrapper around the Laravel API (JWT access/refresh bearer auth).
//
// Session storage model (security):
//  - The short-lived ACCESS token (15 min) lives only in memory — never in
//    localStorage — so it can't be read back after the tab closes.
//  - The long-lived REFRESH token is never visible to JavaScript at all: the
//    backend sets it as an HttpOnly, SameSite=Strict cookie scoped to
//    /api/auth because every request sends `X-Auth-Transport: cookie` (see
//    backend RefreshTokenCookie middleware). An XSS bug therefore can't steal
//    a persistent session.
//  - A non-secret "session hint" flag in localStorage only tells the app
//    whether it's worth attempting a silent cookie refresh on page load.

import { mutate as swrMutate } from 'swr'

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace(/\/+$/, '')
const STORAGE_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '')
const SESSION_HINT_KEY = 'libraryji_session'
// Pre-cookie builds kept both tokens here — read once to migrate, then wiped.
const LEGACY_ACCESS_TOKEN_KEY = 'libraryji_access_token'
const LEGACY_REFRESH_TOKEN_KEY = 'libraryji_refresh_token'

const AUTH_HEADERS: Record<string, string> = { 'X-Auth-Transport': 'cookie' }

export class ApiError extends Error {
  status: number
  errors?: Record<string, string[]>

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

export interface TokenPair {
  access_token: string
  /** Only ever present for non-browser clients; the web app gets an HttpOnly cookie. */
  refresh_token?: string
}

let accessToken: string | null = null

function safeStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

export function getToken(): string | null {
  return accessToken
}

/** True when this browser had a signed-in session that may be restorable via the refresh cookie. */
export function hasSessionHint(): boolean {
  const storage = safeStorage()
  return !!storage && (storage.getItem(SESSION_HINT_KEY) === '1' || !!storage.getItem(LEGACY_REFRESH_TOKEN_KEY))
}

/** Kept for API compatibility — the refresh token is never readable by JS any more. */
export function getRefreshToken(): string | null {
  return null
}

/** Called after login/register/refresh, or with `null` to clear on logout/expiry. */
export function setTokens(tokens: TokenPair | null) {
  const storage = safeStorage()
  accessToken = tokens?.access_token ?? null
  if (!storage) return
  storage.removeItem(LEGACY_ACCESS_TOKEN_KEY)
  storage.removeItem(LEGACY_REFRESH_TOKEN_KEY)
  if (tokens) storage.setItem(SESSION_HINT_KEY, '1')
  else storage.removeItem(SESSION_HINT_KEY)
}

/**
 * Resolve a storage-relative path (e.g. `members/photos/x.jpg`) to a full URL.
 * Uses `/media` (not `/storage`) to match the backend route — the hosting
 * panel's WAF blanket-blocks any `/storage/*` path before it reaches PHP.
 */
export function storageUrl(path?: string | null): string | undefined {
  if (!path) return undefined
  if (path.startsWith('http')) return path
  return `${STORAGE_BASE_URL}/media/${path}`
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: object | FormData
  params?: Record<string, string | number | boolean | undefined | null>
  /** Internal — set on the retry after a silent refresh, to stop at one attempt. */
  _isRetry?: boolean
}

function buildUrl(path: string, params?: RequestOptions['params']): string {
  const url = new URL(`${API_BASE_URL}${path}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    })
  }
  return url.toString()
}

// The access token is short-lived (15 min) by design (see backend config/jwt.php),
// so it expires constantly during normal use — this is what makes that invisible.
// Shared across concurrent 401s so a burst of requests triggers one refresh, not one each.
let refreshPromise: Promise<TokenPair | null> | null = null

async function doRefresh(): Promise<TokenPair | null> {
  const storage = safeStorage()
  // One-time migration of a pre-cookie session: hand the old refresh token
  // to the server once (it answers with the cookie), then forget it.
  const legacy = storage?.getItem(LEGACY_REFRESH_TOKEN_KEY)
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...AUTH_HEADERS },
      body: JSON.stringify(legacy ? { refresh_token: legacy } : {}),
    })
    return res.ok ? ((await res.json()) as TokenPair) : null
  } catch {
    return null
  }
}

export async function refreshTokens(): Promise<TokenPair | null> {
  if (!hasSessionHint()) return null

  if (!refreshPromise) {
    // Serialise refreshes across tabs: each refresh rotates the cookie, so a
    // second tab must wait for the first tab's new cookie before using it.
    const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined
    const run = (): Promise<TokenPair | null> =>
      locks ? locks.request('libraryji-refresh', async () => await doRefresh()).then((t) => t ?? null) : doRefresh()
    refreshPromise = run().finally(() => {
      refreshPromise = null
    })
  }

  const tokens = await refreshPromise
  setTokens(tokens)
  return tokens
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let { method = 'GET', body, params } = options

  // Fresh page load: no in-memory access token yet, but a cookie session may exist.
  if (!accessToken && !options._isRetry && hasSessionHint() && !path.startsWith('/auth/')) {
    await refreshTokens()
  }

  const token = getToken()
  const isFormData = body instanceof FormData

  // Laravel doesn't parse multipart bodies on PUT/PATCH, so spoof via POST + _method.
  if (isFormData && (method === 'PUT' || method === 'PATCH')) {
    ;(body as FormData).append('_method', method)
    method = 'POST'
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...AUTH_HEADERS,
  }
  if (!isFormData) headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(buildUrl(path, params), {
    method,
    headers,
    // Needed so the browser stores/sends the HttpOnly refresh cookie on /auth/*.
    credentials: 'include',
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  })

  if (response.status === 204) return undefined as T

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : undefined

  if (!response.ok) {
    // An expired access token looks identical to any other 401 — try one
    // silent refresh-and-retry before giving up and forcing a re-login.
    if (response.status === 401 && !options._isRetry) {
      const refreshed = await refreshTokens()
      if (refreshed) {
        return request<T>(path, { ...options, _isRetry: true })
      }
    }
    if (response.status === 401) setTokens(null)
    // Plan expired mid-session — let AuthContext re-fetch /auth/me so the
    // layout's renewal gate takes over instead of every card erroring out.
    if (response.status === 402 && typeof window !== 'undefined') {
      window.dispatchEvent(new Event(SUBSCRIPTION_EXPIRED_EVENT))
    }
    // Laravel's default validation-error JSON is {"message": "The given data
    // was invalid.", "errors": {"field": ["the actual message"]}} — the
    // generic top-level message is useless to show, so prefer the first
    // field-specific message whenever one exists.
    const errors = data?.errors as Record<string, string[]> | undefined
    const firstFieldError = errors ? Object.values(errors)[0]?.[0] : undefined
    throw new ApiError(
      firstFieldError || data?.message || `Request failed with status ${response.status}`,
      response.status,
      data?.errors
    )
  }

  return data as T
}

export const SUBSCRIPTION_EXPIRED_EVENT = 'subscription-expired'

export const api = {
  get: <T>(path: string, params?: RequestOptions['params']) => request<T>(path, { method: 'GET', params }),
  post: <T>(path: string, body?: RequestOptions['body']) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: RequestOptions['body']) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: RequestOptions['body']) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

/**
 * Revalidates every cached dashboard-summary-ish SWR key so counts update
 * immediately after a member/staff create-delete-restore, instead of only
 * refreshing whichever list page triggered the change (dashboard stats are
 * fetched under a separate SWR key and were going stale until the next
 * full page load/manual refresh).
 */
export function invalidateDashboard() {
  swrMutate((key) => typeof key === 'string' && key.includes('/dashboard'))
}

/**
 * Revalidates every cached `/admin/members...` SWR key — the list, any
 * open member's `/admin/members/{id}` detail (e.g. the View modal), and its
 * `/history` — after a create/edit/delete. Without this, a page like the
 * members list only refreshes its own list-query key; a detail view fetched
 * under a different key (like the member id it's currently showing) keeps
 * serving stale cached data until something else happens to revalidate it.
 */
export function invalidateMembers() {
  swrMutate((key) => typeof key === 'string' && key.includes('/admin/members'))
}

/**
 * Revalidates every cached `/admin/payments...` and `/admin/statement...` SWR
 * key. Needed after a permanent member delete, which deletes that member's
 * Payment rows server-side (see Member::forceDeleting) — without this, the
 * Payments list and the Income/Expense Statement page keep showing the
 * deleted member's payments from their pre-deletion cached snapshot until
 * something else happens to revalidate those keys.
 */
export function invalidatePayments() {
  swrMutate((key) => typeof key === 'string' && (key.includes('/admin/payments') || key.includes('/admin/statement')))
}

/**
 * Downloads a file (PDF/Excel export) from an authenticated endpoint and
 * saves it via a throwaway <a download> link — plain <a href> can't carry
 * the Bearer token, so the file has to be fetched as a blob first.
 */
export async function downloadFile(path: string, params: RequestOptions['params'], filename: string): Promise<void> {
  if (!accessToken) await refreshTokens()

  const send = () => {
    const headers: Record<string, string> = { ...AUTH_HEADERS }
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
    return fetch(buildUrl(path, params), { headers, credentials: 'include' })
  }

  let response = await send()
  if (response.status === 401 && (await refreshTokens())) {
    response = await send()
  }
  if (!response.ok) {
    throw new ApiError(`Download failed with status ${response.status}`, response.status)
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

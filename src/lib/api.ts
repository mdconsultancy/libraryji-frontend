// Thin fetch wrapper around the Laravel API (JWT access/refresh bearer auth).

import { mutate as swrMutate } from 'swr'

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace(/\/+$/, '')
const STORAGE_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '')
const ACCESS_TOKEN_KEY = 'libraryji_access_token'
const REFRESH_TOKEN_KEY = 'libraryji_refresh_token'

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
  refresh_token: string
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

/** Called after login/register/refresh (both tokens), or with `null` to clear on logout/expiry. */
export function setTokens(tokens: TokenPair | null) {
  if (typeof window === 'undefined') return
  if (tokens) {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token)
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token)
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }
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

async function refreshTokens(): Promise<TokenPair | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
      .then(async (res) => (res.ok ? ((await res.json()) as TokenPair) : null))
      .catch(() => null)
      .finally(() => {
        refreshPromise = null
      })
  }

  const tokens = await refreshPromise
  setTokens(tokens)
  return tokens
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let { method = 'GET', body, params } = options
  const token = getToken()
  const isFormData = body instanceof FormData

  // Laravel doesn't parse multipart bodies on PUT/PATCH, so spoof via POST + _method.
  if (isFormData && (method === 'PUT' || method === 'PATCH')) {
    ;(body as FormData).append('_method', method)
    method = 'POST'
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  if (!isFormData) headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(buildUrl(path, params), {
    method,
    headers,
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
    throw new ApiError(
      data?.message || `Request failed with status ${response.status}`,
      response.status,
      data?.errors
    )
  }

  return data as T
}

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
 * Downloads a file (PDF/Excel export) from an authenticated endpoint and
 * saves it via a throwaway <a download> link — plain <a href> can't carry
 * the Bearer token, so the file has to be fetched as a blob first.
 */
export async function downloadFile(path: string, params: RequestOptions['params'], filename: string): Promise<void> {
  const token = getToken()
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(buildUrl(path, params), { headers })
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

// Thin fetch wrapper around the Laravel API (Sanctum bearer-token auth).

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
const STORAGE_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '')
const TOKEN_KEY = 'libraryji_token'

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

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (typeof window === 'undefined') return
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

/** Resolve a storage-relative path (e.g. `members/photos/x.jpg`) to a full URL. */
export function storageUrl(path?: string | null): string | undefined {
  if (!path) return undefined
  if (path.startsWith('http')) return path
  return `${STORAGE_BASE_URL}/storage/${path}`
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: object | FormData
  params?: Record<string, string | number | boolean | undefined | null>
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
    if (response.status === 401) setToken(null)
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

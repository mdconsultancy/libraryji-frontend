'use client'

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react'
import { api, getToken, getRefreshToken, setTokens, type TokenPair } from '@/lib/api'
import type { User } from '@/types'

interface LoginPayload {
  library_code?: string
  email: string
  password: string
}

interface RegisterPayload {
  library_name: string
  library_code?: string
  established_year?: number
  name: string
  email: string
  phone: string
  alternate_phone?: string
  address?: string
  state?: string
  city?: string
  pincode?: string
  gst_number?: string
  password: string
  password_confirmation: string
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (payload: LoginPayload) => Promise<User>
  register: (payload: RegisterPayload) => Promise<User>
  selectLibrary: (tenantId: number) => Promise<User>
  logout: () => Promise<void>
  refreshMe: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshMe = useCallback(async () => {
    if (!getToken()) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const { user } = await api.get<{ user: User }>('/auth/me')
      setUser(user)
    } catch {
      // api.ts already tried a silent refresh before this throws, so the
      // refresh token itself is gone/expired — nothing left to do but log out.
      setTokens(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshMe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = useCallback(async (payload: LoginPayload) => {
    // The backend always resolves a workspace for admin/staff on its own —
    // the last-selected Library if the admin still has access to it,
    // otherwise their first one. There's no "pick a library" step here;
    // a multi-library admin switches afterwards via the header dropdown.
    const { user, ...tokens } = await api.post<{ user: User } & TokenPair>('/auth/login', payload)
    setTokens(tokens)
    setUser(user)
    return user
  }, [])

  /** Admin-only — the backend rejects this for staff regardless of what's passed. */
  const selectLibrary = useCallback(async (tenantId: number) => {
    const { user } = await api.post<{ user: User }>('/auth/select-library', { tenant_id: tenantId })
    setUser(user)
    return user
  }, [])

  const register = useCallback(async (payload: RegisterPayload) => {
    const { user: _registeredUser, ...tokens } = await api.post<{ user: User } & TokenPair>('/auth/register', payload)
    setTokens(tokens)
    // The register response doesn't eager-load `tenant`; fetch the full profile
    // so downstream checks like tenantNeedsPlan() have what they need.
    const { user } = await api.get<{ user: User }>('/auth/me')
    setUser(user)
    return user
  }, [])

  const logout = useCallback(async () => {
    try {
      // Revokes this refresh token server-side — without this, the pair
      // would keep working (via silent refresh) until it naturally expires.
      await api.post('/auth/logout', { refresh_token: getRefreshToken() })
    } catch {
      // ignore network errors on logout, still clear local state
    }
    setTokens(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, selectLibrary, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

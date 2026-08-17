'use client'

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react'
import { mutate as globalMutate } from 'swr'
import { api, getToken, getRefreshToken, setTokens, type TokenPair } from '@/lib/api'
import type { User } from '@/types'

// SWR's cache is a single app-lifetime store keyed only by API path (see lib/swr.ts),
// not by user/tenant. Without flushing it on every identity change, switching users
// via logout+login (no hard refresh) would keep serving the previous user's cached
// dashboard/members/etc. data until something happened to revalidate those keys.
const clearSwrCache = () => globalMutate(() => true, undefined, { revalidate: false })

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

type LoginResult = { twoFactorRequired: false; user: User } | { twoFactorRequired: true; userId: number }

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (payload: LoginPayload) => Promise<LoginResult>
  verifyTwoFactor: (userId: number, code: string) => Promise<User>
  resendTwoFactor: (userId: number) => Promise<void>
  register: (payload: RegisterPayload) => Promise<User>
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

  const login = useCallback(async (payload: LoginPayload): Promise<LoginResult> => {
    // Every user belongs to exactly one Library, so the backend always
    // resolves it on login — there's no "pick a library" step here.
    const response = await api.post<
      ({ user: User } & TokenPair) | { two_factor_required: true; user_id: number }
    >('/auth/login', payload)

    if ('two_factor_required' in response) {
      return { twoFactorRequired: true, userId: response.user_id }
    }

    const { user, ...tokens } = response
    await clearSwrCache()
    setTokens(tokens)
    setUser(user)
    return { twoFactorRequired: false, user }
  }, [])

  const verifyTwoFactor = useCallback(async (userId: number, code: string) => {
    const { user, ...tokens } = await api.post<{ user: User } & TokenPair>('/auth/2fa/verify', {
      user_id: userId,
      code,
    })
    await clearSwrCache()
    setTokens(tokens)
    setUser(user)
    return user
  }, [])

  const resendTwoFactor = useCallback(async (userId: number) => {
    await api.post('/auth/2fa/resend', { user_id: userId })
  }, [])

  const register = useCallback(async (payload: RegisterPayload) => {
    const { user: _registeredUser, ...tokens } = await api.post<{ user: User } & TokenPair>('/auth/register', payload)
    await clearSwrCache()
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
    await clearSwrCache()
    setTokens(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyTwoFactor, resendTwoFactor, register, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

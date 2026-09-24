'use client'

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react'
import { mutate as globalMutate } from 'swr'
import { api, getToken, getRefreshToken, setTokens, SUBSCRIPTION_EXPIRED_EVENT, type TokenPair } from '@/lib/api'
import type { User } from '@/types'

// SWR's cache is a single app-lifetime store keyed only by API path (see lib/swr.ts),
// not by user/tenant. Without flushing it on every identity change, switching users
// via logout+login (no hard refresh) would keep serving the previous user's cached
// dashboard/members/etc. data until something happened to revalidate those keys.
//
// `revalidate: true` (not false) matters here: BrandingProvider's `/theme` fetch
// (public data, mounted once for the whole app session in the root layout) has
// `revalidateOnFocus: false` — clearing it to `undefined` without also forcing a
// revalidation left it stuck at "still loading" forever after any logout, since
// nothing else was ever going to refetch it. That's what made the public
// marketing homepage/login page intermittently look like it had "lost" content
// (a stuck-blank Google button, an unbranded logo) after logging out and
// navigating back without a full page reload.
const clearSwrCache = () => globalMutate(() => true, undefined, { revalidate: true })

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
  loggingOut: boolean
  login: (payload: LoginPayload) => Promise<LoginResult>
  loginWithGoogle: (credential: string) => Promise<User>
  loginStaffWithGoogle: (credential: string, libraryCode: string) => Promise<User>
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
  const [loggingOut, setLoggingOut] = useState(false)

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

  useEffect(() => {
    let pending = false
    const onExpired = async () => {
      if (pending) return
      pending = true
      try {
        await refreshMe()
      } finally {
        pending = false
      }
    }
    window.addEventListener(SUBSCRIPTION_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(SUBSCRIPTION_EXPIRED_EVENT, onExpired)
  }, [refreshMe])

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

  const loginWithGoogle = useCallback(async (credential: string): Promise<User> => {
    // Same shape as login()/register(): { user, access_token, refresh_token }.
    // A Google sign-in either logs an existing account in or, per product spec,
    // registers a brand-new one on the spot — either way the backend returns
    // a ready-to-use token pair so there's no separate "verify" step.
    const { user, ...tokens } = await api.post<{ user: User } & TokenPair>('/auth/google', { access_token: credential })
    await clearSwrCache()
    setTokens(tokens)
    setUser(user)
    return user
  }, [])

  const loginStaffWithGoogle = useCallback(async (credential: string, libraryCode: string): Promise<User> => {
    // Staff-only counterpart to loginWithGoogle() — hits /auth/google/staff
    // instead of /auth/google, and always sends a Library Code (validated
    // server-side; an invalid code throws an ApiError with a `library_code`
    // field error before any tokens are ever issued). Same response shape,
    // so the token-storage/user-state handling below is identical.
    const { user, ...tokens } = await api.post<{ user: User } & TokenPair>('/auth/google/staff', {
      access_token: credential,
      library_code: libraryCode,
    })
    await clearSwrCache()
    setTokens(tokens)
    setUser(user)
    return user
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
    // Set before the first await so the layout's full-screen GlobalPreloader
    // (shown whenever loggingOut is true) appears immediately on click,
    // instead of only after the network round-trip below resolves.
    setLoggingOut(true)
    try {
      // Revokes this refresh token server-side — without this, the pair
      // would keep working (via silent refresh) until it naturally expires.
      await api.post('/auth/logout', { refresh_token: getRefreshToken() })
    } catch {
      // ignore network errors on logout, still clear local state
    }
    await clearSwrCache()
    setTokens(null)
    // Batched together: the layout goes straight from "loggingOut" to "no
    // user" without ever rendering a stale, still-authenticated frame.
    setUser(null)
    setLoggingOut(false)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, loading, loggingOut, login, loginWithGoogle, loginStaffWithGoogle, verifyTwoFactor, resendTwoFactor, register, logout, refreshMe }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

'use client'

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react'
import { api, getToken, setToken } from '@/lib/api'
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
      setToken(null)
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
    const { user, token } = await api.post<{ user: User; token: string }>('/auth/login', payload)
    setToken(token)
    setUser(user)
    return user
  }, [])

  const register = useCallback(async (payload: RegisterPayload) => {
    const { token } = await api.post<{ user: User; token: string }>('/auth/register', payload)
    setToken(token)
    // The register response doesn't eager-load `tenant`; fetch the full profile
    // so downstream checks like tenantNeedsPlan() have what they need.
    const { user } = await api.get<{ user: User }>('/auth/me')
    setUser(user)
    return user
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore network errors on logout, still clear local state
    }
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

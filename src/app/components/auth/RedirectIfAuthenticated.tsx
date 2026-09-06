'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

/**
 * Guards the Login/Register screens against an already-signed-in visitor —
 * without this, someone with a valid session could still navigate back to
 * /auth/login or /auth/register (browser back button, a bookmarked link, a
 * shared link) and see the form again instead of landing straight back on
 * their dashboard. Uses AuthContext's already-verified `user` (confirmed via
 * /auth/me, not just "a token exists in localStorage"), so a stale/expired
 * token correctly falls through to showing the form rather than redirect-
 * looping.
 */
export default function RedirectIfAuthenticated() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading || !user) return
    router.replace(user.role === 'super_admin' ? '/platform' : '/dashboard')
  }, [loading, user, router])

  return null
}

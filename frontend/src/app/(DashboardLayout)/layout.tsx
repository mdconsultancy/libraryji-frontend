'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Header from './layout/header/Header'
import Sidebar from './layout/sidebar/Sidebar'
import MobileBottomNav from './layout/footer/MobileBottomNav'
import { useAuth } from '@/context/AuthContext'
import { tenantNeedsPlan } from '@/lib/tenant'
import GlobalPreloader from '@/components/shared/GlobalPreloader'

// Routes any authenticated role may reach regardless of the super_admin/tenant split below.
const SHARED_ROUTES = ['/user-profile']

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const needsPlan = user?.role !== 'super_admin' && tenantNeedsPlan(user?.current_tenant)
  // Multi-library admin who logged in without picking a workspace yet (or
  // whose session predates a switch) — every tenant-scoped route 403s until
  // this is resolved, so bounce to the picker instead of a broken dashboard.
  const needsLibrary = user?.role === 'admin' && !user?.current_tenant_id
  const isSharedRoute = SHARED_ROUTES.includes(pathname)
  // Platform (`/platform/**`) is the Super Admin's own panel — every other
  // route here is a tenant's Library workspace. Neither role belongs on the
  // other's side: a tenant admin/staff typing a `/platform/...` URL has no
  // tenant-scoped data to see there, and a super_admin has no current_tenant
  // at all, so tenant pages would just error against a null tenant. Backend
  // middleware (`role:super_admin`) already rejects the API calls either way
  // — this just stops the page shell itself from rendering first.
  const wrongSideForRole =
    !isSharedRoute && !!user &&
    (user.role === 'super_admin' ? !pathname.startsWith('/platform') : pathname.startsWith('/platform'))

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login')
      return
    }
    if (!loading && user && wrongSideForRole) {
      router.replace(user.role === 'super_admin' ? '/platform' : '/')
      return
    }
    if (!loading && user && needsLibrary) {
      router.replace('/select-library')
      return
    }
    if (!loading && user && needsPlan) {
      router.replace('/select-plan')
    }
  }, [loading, user, needsPlan, needsLibrary, wrongSideForRole, router])

  if (loading || !user || needsPlan || needsLibrary || wrongSideForRole) {
    return <GlobalPreloader />
  }

  return (
    <>
      <div className='flex w-full min-h-screen'>
        <div className='page-wrapper flex w-full'>
          {/* Header/sidebar */}
          <div className='xl:block hidden'>
            <Sidebar />
          </div>

          <div className='body-wrapper w-full'>
            {/* Top Header  */}
            <Header />
            {/* Body Content  */}
            <div className="bg-lightgray dark:bg-dark mr-3 rounded-3xl min-h-[90vh]">
              <div className={`container mx-auto px-6 py-30 max-xl:pb-24`}>{children}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-only bottom tab bar, replaces the (already xl-only) Sidebar below xl */}
      <MobileBottomNav />
    </>
  )
}

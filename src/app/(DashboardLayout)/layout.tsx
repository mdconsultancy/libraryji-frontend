'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Header from './layout/header/Header'
import Sidebar from './layout/sidebar/Sidebar'
import MobileBottomNav from './layout/footer/MobileBottomNav'
import FullLogo from './layout/shared/logo/FullLogo'
import { useAuth } from '@/context/AuthContext'
import { tenantNeedsPlan, tenantNeedsOnboarding, tenantIsReadOnly } from '@/lib/tenant'
import { PlanPicker } from '@/components/billing/PlanPicker'
import OnboardingFlow from '@/components/onboarding/OnboardingFlow'
import GlobalPreloader from '@/components/shared/GlobalPreloader'
import ReadOnlyBanner from '@/components/shared/ReadOnlyBanner'

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
  const readOnly = user?.role !== 'super_admin' && tenantIsReadOnly(user?.current_tenant)
  // Onboarding is admin-only (its API routes are role:admin-gated — a staff
  // member has no library-details/Halls/Seats access to complete it with),
  // and must be resolved before the plan gate below can ever be reached.
  const needsOnboarding = user?.role === 'admin' && tenantNeedsOnboarding(user?.current_tenant)
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
    // needsPlan is deliberately NOT redirected — see the inline gate below.
    // A redirect can be navigated away from (back button, typing another
    // URL); rendering the gate in place of every route, regardless of
    // pathname, is what makes it actually unbypassable.
  }, [loading, user, wrongSideForRole, router])

  if (loading || !user || wrongSideForRole) {
    return <GlobalPreloader />
  }

  // Same "unbypassable inline gate, not a route" approach as the plan gate
  // below — resolved first, so a brand-new admin always sees Onboarding
  // before Plan & Pricing, regardless of which URL they land on.
  if (needsOnboarding) {
    return <OnboardingFlow />
  }

  // Same tenant-status check the API enforces server-side — shown as a
  // full-screen gate (not a route) so it follows the user regardless of
  // which URL they land on or navigate to next.
  if (needsPlan) {
    return (
      <div className="min-h-screen w-full bg-lightprimary py-10 px-4 overflow-y-auto">
        <div className="flex justify-center mb-4">
          <FullLogo />
        </div>
        <div className="max-w-4xl mx-auto text-center mb-10">
          <h4 className="text-2xl font-bold text-dark mb-2">
            {user.current_tenant?.trial_ends_at ? 'Your trial has ended' : 'Choose a plan to continue'}
          </h4>
          <p className="text-sm text-charcoal">
            {user.current_tenant?.status === 'suspended' || user.current_tenant?.status === 'cancelled'
              ? 'Complete payment below to activate your library.'
              : user.current_tenant?.trial_ends_at
                ? 'Select a plan below to keep using LibraryJi.'
                : 'Every plan starts with a free first month — no card required.'}
          </p>
        </div>
        <PlanPicker showLogout />
      </div>
    )
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
            {readOnly && <ReadOnlyBanner />}
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

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Icon } from '@iconify/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { usePermission } from '@/hooks/usePermission'
import { useAuth } from '@/context/AuthContext'
import type { PermissionModule } from '@/types'

const leftTabs = [
  { title: 'Dashboard', url: '/', icon: 'solar:widget-add-bold-duotone', permissionModule: 'dashboard' as PermissionModule },
  { title: 'Statements', url: '/expenses', icon: 'solar:wallet-money-bold-duotone', permissionModule: 'statement' as PermissionModule },
]

const rightTabs = [
  { title: 'Fee', url: '/payments', icon: 'solar:bill-check-bold-duotone', permissionModule: 'payments' as PermissionModule },
]

/**
 * Mobile-only (< xl) bottom tab bar — the phone-app navigation pattern that
 * replaces the desktop Sidebar, which is already hidden below xl. The center
 * slot is a raised "Add Member" shortcut rather than a plain tab, since
 * adding a student/member is the single most frequent action on mobile.
 * Every other menu item is still one tap away via the hamburger in
 * MobileHeader, which opens the same Sidebar/Sheet — nothing lost by not
 * duplicating a "More" tab here too.
 */
const MobileBottomNav = () => {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const [venuePickerOpen, setVenuePickerOpen] = useState(false)
  const onVenueTab = pathname === '/halls' || pathname === '/seats'

  // Fixed number of hook calls (rules-of-hooks), same pattern as the
  // desktop Sidebar's modulePermissions — staff additionally needs `view`
  // (or `add`, for the center shortcut) on the module; admin/super_admin
  // always pass.
  const canDashboard = usePermission('dashboard', 'view')
  const canStatement = usePermission('statement', 'view')
  const canPayments = usePermission('payments', 'view')
  const canAddMember = usePermission('members', 'add')
  const canHalls = usePermission('halls', 'view')

  const visibleLeftTabs = leftTabs.filter((tab) => (tab.permissionModule === 'dashboard' ? canDashboard : canStatement))
  const visibleRightTabs = rightTabs.filter(() => canPayments)

  if (!user) return null

  return (
    <nav className="xl:hidden fixed bottom-0 inset-x-0 z-10 bg-background dark:bg-dark border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5 items-end">
        {visibleLeftTabs.map((tab) => {
          const isSelected = pathname === tab.url
          return (
            <Link
              key={tab.url}
              href={tab.url}
              className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] ${
                isSelected ? 'text-primary' : 'text-link dark:text-darklink'
              }`}
            >
              <Icon icon={tab.icon} width={22} height={22} />
              {tab.title}
            </Link>
          )
        })}

        {canAddMember && (
          <Link href="/members" className="flex flex-col items-center justify-center gap-1 pb-2">
            <span className="-mt-6 h-14 w-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/40 ring-4 ring-background dark:ring-dark">
              <Icon icon="tabler:user-plus" width={26} height={26} />
            </span>
            <span className="text-[11px] font-medium text-primary">Member</span>
          </Link>
        )}

        {visibleRightTabs.map((tab) => {
          const isSelected = pathname === tab.url
          return (
            <Link
              key={tab.url}
              href={tab.url}
              className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] ${
                isSelected ? 'text-primary' : 'text-link dark:text-darklink'
              }`}
            >
              <Icon icon={tab.icon} width={22} height={22} />
              {tab.title}
            </Link>
          )
        })}

        {canHalls && (
          <button
            type="button"
            onClick={() => setVenuePickerOpen(true)}
            className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] ${
              onVenueTab ? 'text-primary' : 'text-link dark:text-darklink'
            }`}
          >
            <Icon icon="solar:home-2-bold-duotone" width={22} height={22} />
            Hall and Seats
          </button>
        )}
      </div>

      <Dialog open={venuePickerOpen} onOpenChange={setVenuePickerOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Go to</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setVenuePickerOpen(false); router.push('/halls') }}
              className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 hover:border-primary hover:bg-lightprimary hover:text-primary"
            >
              <Icon icon="solar:buildings-2-bold-duotone" width={28} height={28} />
              <span className="text-sm font-medium">Halls</span>
            </button>
            <button
              type="button"
              onClick={() => { setVenuePickerOpen(false); router.push('/seats') }}
              className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 hover:border-primary hover:bg-lightprimary hover:text-primary"
            >
              <Icon icon="solar:armchair-2-bold-duotone" width={28} height={28} />
              <span className="text-sm font-medium">Seats</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </nav>
  )
}

export default MobileBottomNav

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@iconify/react'

const leftTabs = [
  { title: 'Dashboard', url: '/', icon: 'solar:widget-add-bold-duotone' },
  { title: 'Seats', url: '/seats', icon: 'solar:armchair-2-bold-duotone' },
]

const rightTabs = [
  { title: 'Payments', url: '/payments', icon: 'solar:bill-check-bold-duotone' },
  { title: 'Halls', url: '/halls', icon: 'solar:home-2-bold-duotone' },
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

  return (
    <nav className="xl:hidden fixed bottom-0 inset-x-0 z-10 bg-background dark:bg-dark border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5 items-end">
        {leftTabs.map((tab) => {
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

        <Link href="/members" className="flex flex-col items-center justify-center gap-1 pb-2">
          <span className="-mt-6 h-14 w-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/40 ring-4 ring-background dark:ring-dark">
            <Icon icon="tabler:user-plus" width={26} height={26} />
          </span>
          <span className="text-[11px] font-medium text-primary">Member</span>
        </Link>

        {rightTabs.map((tab) => {
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
      </div>
    </nav>
  )
}

export default MobileBottomNav

'use client'

import { useTheme } from 'next-themes'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import Profile from './Profile'
import Notifications from './Notifications'
import FullLogo from '../shared/logo/FullLogo'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/context/AuthContext'

/**
 * Mobile-only app-bar (< xl breakpoint), separate from the desktop header
 * row in Header.tsx so the two can evolve independently — this one is free
 * to match a phone-app layout without ever touching desktop markup/classes.
 * Reuses the same functional pieces the desktop header uses (Profile,
 * Notifications) rather than reimplementing them.
 */
const MobileHeader = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()
  const showVenueMenu = user?.role === 'admin' || user?.role === 'staff'

  const toggleMode = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'))
  }

  return (
    <div className="xl:hidden bg-background dark:bg-dark">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open menu"
            className="h-9 w-9 flex items-center justify-center rounded-full text-link dark:text-darklink hover:bg-lightprimary hover:text-primary"
          >
            <Icon icon="tabler:menu-2" height={20} width={20} />
          </button>
          <FullLogo />
        </div>

        <div className="flex items-center gap-1">
          {showVenueMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Venue"
                  className="h-9 w-9 flex items-center justify-center rounded-full text-link dark:text-darklink hover:bg-lightprimary hover:text-primary"
                >
                  <Icon icon="solar:home-2-line-duotone" height={20} width={20} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/seats" className="flex items-center gap-2">
                    <Icon icon="solar:armchair-2-line-duotone" width={16} height={16} />
                    Manage Seats
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/halls" className="flex items-center gap-2">
                    <Icon icon="solar:buildings-2-line-duotone" width={16} height={16} />
                    Manage Halls
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <button
            type="button"
            onClick={toggleMode}
            aria-label="Toggle theme"
            className="h-9 w-9 flex items-center justify-center rounded-full text-gray hover:bg-lightprimary hover:text-primary"
          >
            {theme === 'light' ? (
              <Icon icon="tabler:moon" width={20} />
            ) : (
              <Icon icon="solar:sun-bold-duotone" width={20} />
            )}
          </button>
          <Notifications />
          <Profile />
        </div>
      </div>
    </div>
  )
}

export default MobileHeader

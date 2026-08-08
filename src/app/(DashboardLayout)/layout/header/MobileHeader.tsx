'use client'

import { useTheme } from 'next-themes'
import { Icon } from '@iconify/react'
import Profile from './Profile'
import Notifications from './Notifications'
import FullLogo from '../shared/logo/FullLogo'

/**
 * Mobile-only app-bar (< xl breakpoint), separate from the desktop header
 * row in Header.tsx so the two can evolve independently — this one is free
 * to match a phone-app layout without ever touching desktop markup/classes.
 * Reuses the same functional pieces the desktop header uses (Profile,
 * Notifications, Library switching) rather than reimplementing them. The
 * Library switcher/usage pills live inside the Profile dropdown here (no
 * room for them inline on a phone-width bar) — see Profile's
 * `showLibraryControls` prop.
 */
const MobileHeader = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { theme, setTheme } = useTheme()

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
          <Profile showLibraryControls />
        </div>
      </div>
    </div>
  )
}

export default MobileHeader

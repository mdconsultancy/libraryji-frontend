import Link from 'next/link'
import { useTheme } from 'next-themes'
import { usePathname } from 'next/navigation'
import SidebarContent from './Sidebaritems'
import SimpleBar from 'simplebar-react'
import { Icon } from '@iconify/react'
import FullLogo from '../shared/logo/FullLogo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { usePermission } from '@/hooks/usePermission'
import type { PermissionModule } from '@/types'
import {
  AMMenu,
  AMMenuItem,
  AMSidebar,
  AMSubmenu,
} from 'tailwind-sidebar'
import 'tailwind-sidebar/styles.css'

const visibleFor = (roles: string[] | undefined, userRole: string | undefined) =>
  !roles || !roles.length || (userRole ? roles.includes(userRole) : false)

/** Staff additionally needs `view` on the item's module (Library/Halls/
 *  Members/Payments), if it declares one — admin/super_admin always pass. */
const visibleForPermission = (
  permissionModule: PermissionModule | undefined,
  modulePermissions: Record<PermissionModule, boolean>
) => !permissionModule || modulePermissions[permissionModule]

/**
 * Role/permission filtering only ever applied to the top-level list passed
 * into renderSidebarItems — nested `children` (e.g. everything tucked under
 * "More") were rendered unfiltered, so an admin-only or staff-only entry
 * inside a submenu would show to the wrong role even though the link itself
 * still enforces the permission server-side. Filter recursively instead.
 */
const filterVisible = (
  items: any[],
  userRole: string | undefined,
  modulePermissions: Record<PermissionModule, boolean>
): any[] =>
  items
    .filter((item) => visibleFor(item.roles, userRole) && visibleForPermission(item.permissionModule, modulePermissions))
    .map((item) =>
      item.children?.length
        ? { ...item, children: filterVisible(item.children, userRole, modulePermissions) }
        : item
    )
    .filter((item) => !item.children || item.children.length > 0)

const renderSidebarItems = (
  items: any[],
  currentPath: string,
  onClose?: () => void,
  isSubItem: boolean = false
) => {
  return items.map((item, index) => {
    const isSelected = currentPath === item?.url
    const IconComp = item.icon || null

    const iconElement = IconComp ? (
      <Icon icon={IconComp} height={21} width={21} />
    ) : (
      <Icon icon={'ri:checkbox-blank-circle-line'} height={9} width={9} />
    )

    // Heading
    if (item.heading) {
      return (
        <div className='mb-1' key={item.heading}>
          <AMMenu
            subHeading={item.heading}
            ClassName={`hide-menu leading-21 text-white/70 font-bold uppercase text-xs`}
          />
        </div>
      )
    }

    // Submenu
    if (item.children?.length) {
      return (
        <AMSubmenu
          key={item.id}
          icon={iconElement}
          title={item.name}
          // Hover/open colors are handled globally in css/layouts/sidebar.css
          // (`[data-slot='collapsible'] button` rules) — NOT here, because
          // this ClassName prop is applied to the *entire* submenu block
          // (header + expanded items), not just the toggle button, so any
          // `hover:` utility on it lights up the whole block together
          // instead of just the row the mouse is actually over.
          ClassName={`mt-1.5 text-white!`}
          openClassName="text-white!">
          {renderSidebarItems(item.children, currentPath, onClose, true)}
        </AMSubmenu>
      )
    }

    // Regular menu item
    const linkTarget = item.url?.startsWith('https') ? '_blank' : '_self'

    const itemClassNames = isSubItem
      ? `mt-1.5 text-white !hover:bg-white/10 ${isSelected ? '!bg-white !text-black' : ''
      } !px-1.5 `
      : `hover:bg-white/10! hover:text-white! mt-1.5 text-white ${isSelected ? '!bg-white !text-black !hover-bg-white' : ' '}`

    return (
      <div onClick={onClose} key={index}>
        <AMMenuItem
          key={item.id}
          icon={iconElement}
          isSelected={isSelected}
          link={item.url || undefined}
          target={linkTarget}
          badgeColor='bg-lightsecondary'
          badgeTextColor='text-secondary'
          disabled={item.disabled}
          component={Link}
          className={`${itemClassNames}`}>
          <span className='truncate flex-1'>{item.title || item.name}</span>
        </AMMenuItem>
      </div>
    )
  })
}

const SidebarLayout = ({ onClose }: { onClose?: () => void }) => {
  const pathname = usePathname()
  const { theme } = useTheme()
  const { user } = useAuth()

  // Only allow "light" or "dark" for AMSidebar
  const sidebarMode = theme === 'light' || theme === 'dark' ? theme : undefined

  const modulePermissions: Record<PermissionModule, boolean> = {
    library: usePermission('library', 'view'),
    halls: usePermission('halls', 'view'),
    members: usePermission('members', 'view'),
    payments: usePermission('payments', 'view'),
  }

  const visibleSections = SidebarContent.filter((section) => visibleFor(section.roles, user?.role))

  return (
    <AMSidebar
      collapsible='none'
      animation={true}
      showProfile={false}
      width={'270px'}
      showTrigger={false}
      mode={sidebarMode}
      // Library defaults (themeColor #5d87ff, textColor #2b2b2b) assume a
      // light sidebar — ours is dark (bg-primary), so an open submenu's own
      // background and the closed-state text color need to track our actual
      // theme instead, or they render mismatched/near-invisible.
      themeColor='var(--color-primary)'
      textColor='#ffffff'
      className='fixed left-0 top-0 border-none bg-primary z-10 h-screen'>
      {/* Logo — from Admin Settings -> Theme via FullLogo/BrandingContext, same as every other panel.
          Wrapped in a light chip so a dark-text logo stays legible on the blue sidebar bg. */}
      <div className='px-4 py-2 flex items-center brand-logo overflow-hidden'>
        <div className='bg-white rounded-md px-2 py-1.5 inline-flex'>
          <FullLogo />
        </div>
      </div>

      {/* Sidebar items */}

      <SimpleBar className='h-[calc(100vh-10vh)]'>
        <div className='px-6'>
          {visibleSections.map((section, index) => (
            <div key={index}>
              {renderSidebarItems(
                [
                  ...(section.heading ? [{ heading: section.heading }] : []),
                  ...filterVisible(section.children || [], user?.role, modulePermissions),
                ],
                pathname,
                onClose
              )}
            </div>
          ))}
        </div>
      </SimpleBar>
    </AMSidebar>
  )
}

export default SidebarLayout

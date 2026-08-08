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
            ClassName={`hide-menu leading-21 text-charcoal font-bold uppercase text-xs dark:text-darkcharcoal`}
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
          ClassName={`mt-1.5 text-link dark:text-darklink`}>
          {renderSidebarItems(item.children, currentPath, onClose, true)}
        </AMSubmenu>
      )
    }

    // Regular menu item
    const linkTarget = item.url?.startsWith('https') ? '_blank' : '_self'

    const itemClassNames = isSubItem
      ? `mt-1.5 text-link dark:text-darklink !hover:bg-transparent ${isSelected ? '!bg-transparent !text-primary' : ''
      } !px-1.5 `
      : `hover:bg-lightprimary! hover:text-primary! mt-1.5 text-link dark:text-darklink ${isSelected ? '!bg-lightprimary !text-primary !hover-bg-lightprimary' : ' '}`

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
      className='fixed left-0 top-0 border-none bg-background z-10 h-screen'>
      {/* Logo — from Admin Settings -> Theme via FullLogo/BrandingContext, same as every other panel. */}
      <div className='px-4 flex items-center brand-logo overflow-hidden'>
        <FullLogo />
      </div>

      {/* Sidebar items */}

      <SimpleBar className='h-[calc(100vh-10vh)]'>
        <div className='px-6'>
          {visibleSections.map((section, index) => (
            <div key={index}>
              {renderSidebarItems(
                [
                  ...(section.heading ? [{ heading: section.heading }] : []),
                  ...(section.children || []).filter(
                    (child) => visibleFor(child.roles, user?.role) && visibleForPermission(child.permissionModule, modulePermissions)
                  ),
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

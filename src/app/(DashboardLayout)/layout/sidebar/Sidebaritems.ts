import { uniqueId } from 'lodash'

export interface ChildItem {
  id?: number | string
  name?: string
  icon?: any
  children?: ChildItem[]
  item?: any
  url?: any
  color?: string
  disabled?: boolean
  subtitle?: string
  badge?: boolean
  badgeType?: string
  isPro?: boolean
  roles?: string[]
  /** For staff, also hidden unless they have `view` on this module (Library/Halls/Members/Payments). Admin/super_admin ignore this — they always have full access. */
  permissionModule?: 'library' | 'halls' | 'members' | 'payments'
}

export interface MenuItem {
  heading?: string
  name?: string
  icon?: any
  id?: number
  to?: string
  items?: MenuItem[]
  children?: ChildItem[]
  url?: any
  disabled?: boolean
  subtitle?: string
  badgeType?: string
  badge?: boolean
  isPro?: boolean
  roles?: string[]
}

// roles omitted = visible to every authenticated role.
// 'admin' items are visible to tenant admins; 'staff' items to staff; 'super_admin' items to the platform section.
//
// Admin/staff top-level nav is intentionally short — Dashboard, Manage
// Students, Payments, Waiting List, Old Students, Library Info — with every
// other library-management screen tucked under the single "More" accordion
// item below (collapsed by default; AMSubmenu renders it as an expandable
// group, same mechanism used for Platform's nested items).
const SidebarContent: MenuItem[] = [
  {
    heading: 'Main',
    roles: ['admin', 'staff'],
    children: [
      {
        name: 'Dashboard',
        icon: 'solar:widget-add-line-duotone',
        id: uniqueId(),
        url: '/',
        roles: ['admin', 'staff'],
      },
      {
        name: 'Manage Students',
        icon: 'solar:users-group-rounded-line-duotone',
        id: uniqueId(),
        url: '/members',
        roles: ['admin', 'staff'],
        permissionModule: 'members',
      },
      {
        name: 'Students Fee',
        icon: 'solar:bill-check-line-duotone',
        id: uniqueId(),
        url: '/payments',
        roles: ['admin', 'staff'],
        permissionModule: 'payments',
      },
      {
        name: 'Statements',
        icon: 'solar:wallet-money-line-duotone',
        id: uniqueId(),
        url: '/expenses',
        roles: ['admin', 'staff'],
      },
      {
        name: 'Waiting List',
        icon: 'solar:user-speak-line-duotone',
        id: uniqueId(),
        url: '/leads',
        roles: ['admin', 'staff'],
        permissionModule: 'members',
      },
      {
        name: 'Old Students',
        icon: 'solar:history-line-duotone',
        id: uniqueId(),
        url: '/members/old',
        roles: ['admin', 'staff'],
        permissionModule: 'members',
      },
      {
        name: 'More',
        icon: 'solar:widget-5-line-duotone',
        id: uniqueId(),
        roles: ['admin', 'staff'],
        children: [
          {
            name: 'Shifts',
            icon: 'solar:clock-circle-line-duotone',
            id: uniqueId(),
            url: '/shifts',
            roles: ['admin', 'staff'],
          },
          {
            // Library Admin no longer manages Membership Plans at all (product
            // decision) — staff-only now, both here and enforced server-side.
            name: 'Membership Plans',
            icon: 'solar:document-text-line-duotone',
            id: uniqueId(),
            url: '/membership-plans',
            roles: ['staff'],
          },
          {
            name: 'Staff',
            icon: 'solar:shield-user-outline',
            id: uniqueId(),
            url: '/staff',
            roles: ['admin'],
          },
          {
            name: 'My Plan & Subscription',
            icon: 'solar:bill-list-line-duotone',
            id: uniqueId(),
            url: '/billing',
            roles: ['admin'],
          },
        ],
      },
    ],
  },
  {
    heading: 'Platform',
    roles: ['super_admin'],
    children: [
      {
        name: 'Dashboard',
        icon: 'solar:widget-add-line-duotone',
        id: uniqueId(),
        url: '/platform',
        roles: ['super_admin'],
      },
      {
        name: 'Libraries',
        icon: 'solar:buildings-3-line-duotone',
        id: uniqueId(),
        url: '/platform/tenants',
        roles: ['super_admin'],
      },
      {
        name: 'User Management',
        icon: 'solar:users-group-rounded-line-duotone',
        id: uniqueId(),
        url: '/platform/users',
        roles: ['super_admin'],
      },
      {
        name: 'Subscription Plans',
        icon: 'solar:document-text-line-duotone',
        id: uniqueId(),
        url: '/platform/subscription-plans',
        roles: ['super_admin'],
      },
      {
        name: 'Subscriptions & Payments',
        icon: 'solar:card-2-line-duotone',
        id: uniqueId(),
        url: '/platform/subscriptions',
        roles: ['super_admin'],
      },
      {
        name: 'Platform Settings',
        icon: 'solar:settings-minimalistic-line-duotone',
        id: uniqueId(),
        url: '/platform/settings',
        roles: ['super_admin'],
      },
      {
        name: 'Audit Logs',
        icon: 'solar:document-text-line-duotone',
        id: uniqueId(),
        url: '/platform/audit-logs',
        roles: ['super_admin'],
      },
    ],
  },
  {
    heading: 'Account',
    children: [
      {
        id: uniqueId(),
        name: 'User Profile',
        icon: 'solar:user-circle-linear',
        url: '/user-profile',
      },
    ],
  },
]

export default SidebarContent

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
const SidebarContent: MenuItem[] = [
  {
    heading: 'Main',
    children: [
      {
        name: 'Dashboard',
        icon: 'solar:widget-add-line-duotone',
        id: uniqueId(),
        url: '/',
        roles: ['admin', 'staff'],
      },
    ],
  },
  {
    heading: 'Library',
    roles: ['admin', 'staff'],
    children: [
      {
        name: 'Halls',
        icon: 'solar:home-2-line-duotone',
        id: uniqueId(),
        url: '/halls',
        roles: ['admin', 'staff'],
      },
      {
        name: 'Seats',
        icon: 'solar:armchair-2-line-duotone',
        id: uniqueId(),
        url: '/seats',
        roles: ['admin', 'staff'],
      },
      {
        name: 'Shifts',
        icon: 'solar:clock-circle-line-duotone',
        id: uniqueId(),
        url: '/shifts',
        roles: ['admin', 'staff'],
      },
      {
        name: 'Membership Plans',
        icon: 'solar:document-text-line-duotone',
        id: uniqueId(),
        url: '/membership-plans',
        roles: ['admin', 'staff'],
      },
    ],
  },
  {
    heading: 'Members',
    roles: ['admin', 'staff'],
    children: [
      {
        name: 'Members',
        icon: 'solar:users-group-rounded-line-duotone',
        id: uniqueId(),
        url: '/members',
        roles: ['admin', 'staff'],
      },
      {
        name: 'Subscriptions',
        icon: 'solar:card-2-line-duotone',
        id: uniqueId(),
        url: '/subscriptions',
        roles: ['admin', 'staff'],
      },
      {
        name: 'Attendance',
        icon: 'solar:calendar-mark-line-duotone',
        id: uniqueId(),
        url: '/attendance',
        roles: ['admin', 'staff'],
      },
    ],
  },
  {
    heading: 'Finance',
    roles: ['admin', 'staff'],
    children: [
      {
        name: 'Payments',
        icon: 'solar:bill-check-line-duotone',
        id: uniqueId(),
        url: '/payments',
        roles: ['admin', 'staff'],
      },
      {
        name: 'Expenses',
        icon: 'solar:wallet-money-line-duotone',
        id: uniqueId(),
        url: '/expenses',
        roles: ['admin', 'staff'],
      },
    ],
  },
  {
    heading: 'Administration',
    roles: ['admin'],
    children: [
      {
        name: 'Staff',
        icon: 'solar:shield-user-outline',
        id: uniqueId(),
        url: '/staff',
        roles: ['admin'],
      },
      {
        name: 'Subscription',
        icon: 'solar:bill-list-line-duotone',
        id: uniqueId(),
        url: '/billing',
        roles: ['admin'],
      },
      {
        name: 'Library Settings',
        icon: 'solar:settings-minimalistic-line-duotone',
        id: uniqueId(),
        url: '/settings',
        roles: ['admin'],
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

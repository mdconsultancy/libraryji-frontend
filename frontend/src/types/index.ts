// Domain types mirroring the Laravel API (LibraryJi backend).

export type UserRole = 'super_admin' | 'admin' | 'staff' | 'member'
export type TenantStatus = 'trial' | 'active' | 'suspended' | 'cancelled'
export type SeatType = 'general' | 'ac' | 'non_ac' | 'cabin' | 'premium'
export type SeatStatus = 'available' | 'occupied' | 'reserved' | 'maintenance'
export type MemberStatus = 'active' | 'inactive' | 'expired'
export type MemberGender = 'male' | 'female' | 'other'
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled'
export type AttendanceMethod = 'manual' | 'qr' | 'self'
export type PaymentType = 'subscription' | 'other'
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'bank_transfer' | 'razorpay' | 'stripe' | 'other'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type BillingCycle = 'monthly' | 'quarterly' | 'yearly'
export type TenantSubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'cancelled' | 'expired'

export interface SubscriptionPlan {
  id: number
  name: string
  slug: string
  description: string | null
  price: string | number
  billing_cycle: BillingCycle
  max_seats: number
  max_members: number
  max_staff: number
  features: string[] | null
  is_active: boolean
  sort_order: number
  created_at?: string
  updated_at?: string
}

export interface TenantSubscription {
  id: number
  tenant_id: number
  subscription_plan_id: number
  status: TenantSubscriptionStatus
  amount: string | number
  starts_at: string
  ends_at: string | null
  payment_gateway: string | null
  gateway_reference: string | null
  invoice_number: string | null
  razorpay_order_id: string | null
  plan?: SubscriptionPlan
  tenant?: Tenant
  created_at?: string
}

export interface Tenant {
  id: number
  name: string
  slug: string
  library_code: string | null
  established_year: number | null
  email: string
  phone: string
  alternate_phone: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string
  pincode: string | null
  gst_number: string | null
  logo_path: string | null
  timezone: string
  status: TenantStatus
  trial_ends_at: string | null
  has_active_plan?: boolean
  activeSubscription?: TenantSubscription | null
  users_count?: number
  halls_count?: number
  seats_count?: number
  members_count?: number
  created_at?: string
}

export interface User {
  id: number
  tenant_id: number | null
  role: UserRole
  name: string
  email: string
  phone: string | null
  avatar_path: string | null
  status: 'active' | 'inactive'
  two_factor_enabled: boolean
  last_login_at: string | null
  tenant?: Tenant
  created_at?: string
}

export interface Hall {
  id: number
  tenant_id: number
  name: string
  description: string | null
  status: 'active' | 'inactive'
  seats_count?: number
}

export interface Seat {
  id: number
  tenant_id: number
  hall_id: number | null
  seat_number: string
  seat_type: SeatType
  status: SeatStatus
  position_x: string | number
  position_y: string | number
  hall?: Hall
  currentSubscription?: MemberSubscription | null
}

export interface Shift {
  id: number
  tenant_id: number
  name: string
  start_time: string
  end_time: string
  status: 'active' | 'inactive'
}

export interface MembershipPlan {
  id: number
  tenant_id: number
  shift_id: number | null
  name: string
  description: string | null
  duration_days: number
  price: string | number
  seat_type: SeatType | null
  fixed_seat: boolean
  status: 'active' | 'inactive'
  shift?: Shift
}

export interface Member {
  id: number
  tenant_id: number
  user_id: number | null
  member_code: string
  name: string
  email: string | null
  phone: string
  photo_path: string | null
  address: string | null
  id_proof_type: string | null
  id_proof_number: string | null
  id_proof_path: string | null
  date_of_birth: string | null
  gender: MemberGender | null
  join_date: string
  status: MemberStatus
  notes: string | null
  subscriptions?: MemberSubscription[]
  activeSubscription?: MemberSubscription | null
  attendances?: Attendance[]
  payments?: Payment[]
  created_at?: string
}

export interface MemberSubscription {
  id: number
  tenant_id: number
  member_id: number
  membership_plan_id: number
  seat_id: number | null
  shift_id: number | null
  plan_name_snapshot: string
  amount: string | number
  start_date: string
  end_date: string
  status: SubscriptionStatus
  member?: Member
  plan?: MembershipPlan
  seat?: Seat
  shift?: Shift
  created_at?: string
}

export interface Attendance {
  id: number
  tenant_id: number
  member_id: number
  date: string
  check_in: string
  check_out: string | null
  method: AttendanceMethod
  member?: Member
}

export interface Payment {
  id: number
  tenant_id: number
  member_id: number | null
  member_subscription_id: number | null
  invoice_number: string
  type: PaymentType
  amount: string | number
  payment_method: PaymentMethod
  status: PaymentStatus
  transaction_id: string | null
  notes: string | null
  paid_at: string | null
  member?: Member
  subscription?: MemberSubscription
  created_at?: string
}

export interface Expense {
  id: number
  tenant_id: number
  category: string
  title: string
  amount: string | number
  expense_date: string
  notes: string | null
}

export interface AuditLog {
  id: number
  tenant_id: number | null
  user_id: number | null
  action: string
  auditable_type: string | null
  auditable_id: number | null
  changes: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  tenant?: Tenant
  user?: User
}

export interface DashboardSummary {
  total_members: number
  active_members: number
  present_today: number
  absent_today: number
  total_seats: number
  occupied_seats: number
  available_seats: number
  occupancy_rate: number
  expiring_soon: number
  today_attendance: number
  currently_checked_in: number
  revenue_this_month: number
  revenue_last_month: number
  cash_this_month: number
  online_this_month: number
}

export interface RevenueChartPoint {
  month: string
  revenue: number
}

export interface AttendanceChartPoint {
  date: string
  count: number
  present: number
  absent: number
}

export interface PlatformSummary {
  total_tenants: number
  active_tenants: number
  trial_tenants: number
  suspended_tenants: number
  total_members_platform_wide: number
  monthly_recurring_revenue: number
}

export interface TenantGrowthPoint {
  month: string
  new_tenants: number
}

export interface Paginated<T> {
  current_page: number
  data: T[]
  first_page_url: string | null
  from: number | null
  last_page: number
  last_page_url: string | null
  links: { url: string | null; label: string; active: boolean }[]
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number | null
  total: number
}

export type PlanLimitResource = 'seats' | 'members' | 'staff'

export interface PlanLimitEntry {
  limit: number | null
  used: number
  remaining: number | null
  exceeded: boolean
}

export type PlanLimitSummary = Record<PlanLimitResource, PlanLimitEntry>

// Super-admin "User Management" — library-owning (tenant admin) users.
export interface UserManagementRow {
  id: number
  name: string
  email: string
  phone: string | null
  status: 'active' | 'inactive'
  created_at?: string
  tenant: (Tenant & {
    activeSubscription?: TenantSubscription | null
    halls_count?: number
    seats_count?: number
    members_count?: number
  }) | null
}

export interface UserManagementDetail extends UserManagementRow {
  tenant: (Tenant & {
    halls?: Hall[]
    subscriptions?: TenantSubscription[]
    membershipPlans?: MembershipPlan[]
    seats_count?: number
    members_count?: number
  }) | null
}

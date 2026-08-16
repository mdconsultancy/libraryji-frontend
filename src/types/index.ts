// Domain types mirroring the Laravel API (LibraryJi backend).

export type UserRole = 'super_admin' | 'admin' | 'staff' | 'member'
export type TenantStatus = 'trial' | 'active' | 'suspended' | 'cancelled'
export type SeatType = 'general' | 'ac' | 'non_ac' | 'cabin' | 'premium'
export type SeatCategory = 'regular' | 'rotation'
export type SeatStatus = 'available' | 'occupied' | 'reserved' | 'maintenance'
export type MemberStatus = 'active' | 'inactive' | 'expired'
export type MemberGender = 'male' | 'female' | 'other'
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled'
export type AttendanceMethod = 'manual' | 'qr' | 'self'
export type PaymentType = 'subscription' | 'other'
export type PaymentMethod = 'cash' | 'online' | 'offline' | 'upi'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type BillingCycle = 'monthly' | 'quarterly' | 'yearly'
export type TenantSubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'cancelled' | 'expired'

/** One line item in a plan's feature list, with its own include/exclude toggle. */
export interface PlanFeature {
  text: string
  included: boolean
}

export interface SubscriptionPlan {
  id: number
  name: string
  slug: string
  description: string | null
  price: string | number
  /** Struck-through "was" price shown next to the real price — null means no discount badge. */
  original_price: string | number | null
  billing_cycle: BillingCycle
  /** Short ribbon text on the pricing card, e.g. "BEST VALUE". */
  badge_text: string | null
  /** Seats, members & staff are unlimited on every plan; these are legacy columns kept for reference and are always null. */
  max_seats: number | null
  max_members: number | null
  max_staff: number | null
  /** Older plans may still have plain strings (always "included") — normalize with normalizePlanFeatures() before rendering. */
  features: (string | PlanFeature)[] | null
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
  seat_limit?: number | null
  trial_ends_at: string | null
  onboarding_completed_at: string | null
  has_active_plan?: boolean
  // Laravel snake_cases relation names in JSON — this is `active_subscription`
  // on the wire (verified against the live API), not `activeSubscription`.
  active_subscription?: TenantSubscription | null
  users_count?: number
  halls_count?: number
  seats_count?: number
  members_count?: number
  created_at?: string
}

export type PermissionModule = 'library' | 'halls' | 'members' | 'payments' | 'expenses' | 'statement' | 'attendance' | 'dashboard' | 'reports'
export type PermissionAction = 'view' | 'add' | 'edit' | 'delete' | 'pdf_download' | 'excel_download' | 'download'

/** Flat list of "module.action" keys a staff member has been granted — see
 *  App\Support\Permissions on the backend, the single source of truth this
 *  mirrors. Only ever meaningful for role=staff — admin/super_admin always
 *  have full access regardless of what's stored here. */
export type StaffPermissions = string[]

/** One entry from `GET admin/permissions/definitions` — drives the Staff
 *  permission panel so it never hardcodes the list of grantable keys. */
export interface PermissionDefinition {
  key: string
  label: string
  group: string
}

/** A Library this user has access to, with their role and (for staff) granular permissions in that specific Library. */
export type TenantMembership = Tenant & { pivot: { role: 'admin' | 'staff'; permissions?: StaffPermissions | null } }

export type WhatsAppLanguage = 'en' | 'hi' | 'gu'

export interface User {
  id: number
  /** The Library workspace currently selected — null for super_admin, and
   *  briefly null for a multi-library admin who hasn't picked one yet. */
  current_tenant_id: number | null
  role: UserRole
  name: string
  email: string | null
  phone: string | null
  avatar_path: string | null
  /** Admin's own UPI ID / payment contact number, surfaced in the WhatsApp fee-reminder template. */
  upi_id?: string | null
  payment_number?: string | null
  /** Which language(s) WhatsApp templates go out in — member gets the message once per selected language. Defaults to English only. */
  whatsapp_languages?: WhatsAppLanguage[] | null
  status: 'active' | 'inactive'
  two_factor_enabled: boolean
  last_login_at: string | null
  /** The currently selected Library (loaded via current_tenant_id). */
  current_tenant?: Tenant
  /** Every Library this user belongs to. Staff always has exactly one;
   *  an admin may have several — use this to drive the Library Switcher. */
  tenants?: TenantMembership[]
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
  category: SeatCategory
  status: SeatStatus
  position_x: string | number
  position_y: string | number
  hall?: Hall
  current_subscription?: MemberSubscription | null
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
  whatsapp_number: string | null
  /** Short-lived signed URL, not a static path — the raw storage path is never sent to the client. */
  photo_url: string | null
  address: string | null
  id_proof_type: string | null
  id_proof_number: string | null
  /** Short-lived signed URL, not a static path. */
  id_proof_url: string | null
  id_proof_front_url: string | null
  id_proof_back_url: string | null
  date_of_birth: string | null
  gender: MemberGender | null
  join_date: string
  status: MemberStatus
  notes: string | null
  subscriptions?: MemberSubscription[]
  active_subscription?: MemberSubscription | null
  attendances?: Attendance[]
  payments?: Payment[]
  created_at?: string
  deleted_at?: string | null
  last_updated_by?: string | null
  last_updated_at?: string | null
}

export interface MemberHistoryEntry {
  action: string
  user_name: string
  created_at: string
  changes: Record<string, unknown> | null
}

export type LeadStatus = 'new' | 'contacted' | 'converted' | 'lost'

export interface Lead {
  id: number
  tenant_id: number
  name: string
  phone: string
  whatsapp_number: string | null
  status: LeadStatus
  notes: string | null
  converted_member_id: number | null
  converted_member?: Member
  created_at?: string
}

export interface MemberSubscription {
  id: number
  tenant_id: number
  member_id: number
  membership_plan_id: number | null
  duration_months: number | null
  duration_unit: 'day' | 'month' | 'custom' | null
  duration_days: number | null
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
  payments?: Payment[]
  paid_amount?: number
  due_amount?: number
  fee_status?: 'paid' | 'partial' | 'pending'
  days_left?: number | null
  created_at?: string
}

export interface Attendance {
  id: number
  tenant_id: number
  member_id: number
  date: string
  check_in: string | null
  check_out: string | null
  method: AttendanceMethod
  status: 'present' | 'absent'
  member?: Member
}

export interface AttendanceRosterMember {
  id: number
  name: string
  member_code: string
  email: string | null
  phone: string | null
  photo_url: string | null
  status: 'present' | 'absent' | null
}

export interface AttendanceRoster {
  date: string
  members: AttendanceRosterMember[]
  present_count: number
  absent_count: number
  unmarked_count: number
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
  created_by?: number | null
  created_by_name?: string | null
  created_by_role?: string | null
  creator?: { id: number; name: string; role: string } | null
}

export interface Expense {
  id: number
  tenant_id: number
  category: string
  title: string
  amount: string | number
  expense_date: string
  payment_mode?: PaymentMethod
  notes: string | null
  created_by?: number | null
  created_by_name?: string | null
  created_by_role?: string | null
  creator?: { id: number; name: string; role: string } | null
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
  staff_count: number
  halls_count: number
  expenses_this_month: number
  expiring_soon: number
  today_attendance: number
  currently_checked_in: number
  revenue_this_month: number
  revenue_last_month: number
  cash_this_month: number
  online_this_month: number
  rotation_seats: number
  fee_paid_students: number
  partial_fee_students: number
  fee_pending_students: number
  total_inquiries: number
  today_inquiries: number
}

export type RecentActivityType = 'member_joined' | 'payment_received' | 'attendance_check_in'

export interface RecentActivityItem {
  type: RecentActivityType
  title: string
  subtitle: string
  occurred_at: string
}

export interface RevenueChartPoint {
  month: string
  revenue: number
  expenses: number
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

// Super-admin "User Management" — library-owning (admin) users, each of
// whom may own/manage more than one Library (tenant_user membership pivot).
export interface UserManagementRow {
  id: number
  name: string
  email: string
  phone: string | null
  status: 'active' | 'inactive'
  created_at?: string
  tenants_count: number
  /** Estimated DB storage used across every Library this user owns, from information_schema row-size estimates. */
  db_storage_mb: number
  /** Actual on-disk size (tenant logo + member photos/ID proofs) across every Library this user owns. */
  media_storage_mb: number
  tenants: (Tenant & {
    pivot: { role: 'admin' | 'staff' }
    halls_count?: number
    seats_count?: number
    members_count?: number
  })[]
}

export interface UserManagementDetail extends UserManagementRow {
  tenants: (Tenant & {
    pivot: { role: 'admin' | 'staff' }
    halls?: (Hall & { seats_count?: number })[]
    subscriptions?: TenantSubscription[]
    membership_plans?: MembershipPlan[]
    seats_count?: number
    members_count?: number
    expenses_count?: number
    expenses_sum_amount?: string | number | null
    db_storage_mb: number
    media_storage_mb: number
  })[]
}

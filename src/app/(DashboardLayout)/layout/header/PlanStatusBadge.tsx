'use client'

import Link from 'next/link'
import { Icon } from '@iconify/react'
import { useAuth } from '@/context/AuthContext'
import { getPlanStatus } from '@/lib/planStatus'

/** Small clickable pill near the header profile — red while on a trial (or
 *  once a real plan has expired), green while a paid plan still has runway.
 *  Only ever renders for admin/staff (a super_admin has no tenant plan). */
const PlanStatusBadge = () => {
  const { user } = useAuth()

  if (user?.role !== 'admin' && user?.role !== 'staff') return null

  const status = getPlanStatus(user.current_tenant)
  if (!status) return null

  const isBad = status.isTrial || status.expired

  return (
    <Link
      href="/billing"
      className={`hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80 ${
        isBad ? 'bg-lighterror text-error' : 'bg-lightsuccess text-success'
      }`}
    >
      <Icon icon={status.isTrial ? 'solar:hourglass-line-duotone' : 'solar:verified-check-bold'} width={14} height={14} />
      {status.label}
    </Link>
  )
}

export default PlanStatusBadge

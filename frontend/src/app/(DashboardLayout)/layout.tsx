'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from './layout/header/Header'
import Sidebar from './layout/sidebar/Sidebar'
import { useAuth } from '@/context/AuthContext'
import { tenantNeedsPlan } from '@/lib/tenant'
import GlobalPreloader from '@/components/shared/GlobalPreloader'

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const needsPlan = user?.role !== 'super_admin' && tenantNeedsPlan(user?.tenant)

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login')
      return
    }
    if (!loading && user && needsPlan) {
      router.replace('/select-plan')
    }
  }, [loading, user, needsPlan, router])

  if (loading || !user || needsPlan) {
    return <GlobalPreloader />
  }

  return (
    <>
      <div className='flex w-full min-h-screen'>
        <div className='page-wrapper flex w-full'>
          {/* Header/sidebar */}
          <div className='xl:block hidden'>
            <Sidebar />
          </div>

          <div className='body-wrapper w-full'>
            {/* Top Header  */}
            <Header />
            {/* Body Content  */}
            <div className="bg-lightgray dark:bg-dark mr-3 rounded-3xl min-h-[90vh]">
              <div className={`container mx-auto px-6 py-30`}>{children}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

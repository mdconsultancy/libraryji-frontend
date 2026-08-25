'use client'

import { Icon } from '@iconify/react'
import SimpleBar from 'simplebar-react'
import 'simplebar-react/dist/simplebar.min.css'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu'
import { useApi } from '@/hooks/useApi'
import { api } from '@/lib/api'

interface AppNotification {
  id: number
  title: string
  body: string
  read_at: string | null
  created_at: string
}

interface NotificationsPage {
  data: AppNotification[]
}

// Web is history-only, no browser push subscription — matches the product
// decision that push delivery only happens on the mobile app; the web
// dashboard just shows what already landed, polled via the shared SWR
// refresh interval (see swrConfig) so it stays reasonably live without a
// dedicated websocket/push channel.
const Notifications = () => {
  const { data, mutate } = useApi<NotificationsPage>('/notifications', { per_page: 10 })
  const notifications = data?.data ?? []
  const unreadCount = notifications.filter((n) => !n.read_at).length

  const handleOpenChange = (open: boolean) => {
    if (!open || unreadCount === 0) return
    api.post('/notifications/read-all').then(() => mutate())
  }

  return (
    <div className='relative group/menu px-15'>
      <DropdownMenu onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <div className='relative'>
            <span className='relative after:absolute after:w-10 after:h-10 after:rounded-full hover:text-primary after:-top-1/2 hover:after:bg-lightprimary rounded-full flex justify-center items-center cursor-pointer group-hover/menu:after:bg-lightprimary group-hover/menu:text-primary'>
              <Icon icon='tabler:bell-ringing' height={20} />
              {unreadCount > 0 && (
                <span className='absolute top-0 right-0 h-4 min-w-4 px-1 rounded-full bg-error text-white text-[10px] leading-4 text-center'>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </span>
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align='end'
          className='w-screen sm:w-[340px] py-4 rounded-sm'>
          <div className='flex items-center px-6 justify-between'>
            <h3 className='mb-0 text-lg font-semibold text-ld'>Notification</h3>
          </div>

          <SimpleBar className='max-h-80 mt-3'>
            {notifications.length === 0 ? (
              <p className='px-6 py-4 text-sm text-darklink'>No notifications</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className='px-6 py-3 border-b border-border last:border-0'>
                  <div className='flex items-start gap-2'>
                    {!n.read_at && <span className='mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0' />}
                    <div className='min-w-0'>
                      <p className='text-sm font-medium text-ld truncate'>{n.title}</p>
                      <p className='text-xs text-darklink line-clamp-2'>{n.body}</p>
                      <p className='text-[11px] text-darklink mt-1'>
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </SimpleBar>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default Notifications

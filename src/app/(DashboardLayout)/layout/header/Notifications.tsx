'use client'

import { Icon } from '@iconify/react'
import SimpleBar from 'simplebar-react'
import 'simplebar-react/dist/simplebar.min.css'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu'

// No notifications endpoint exists in the backend yet, so this shows an empty state only.
const Notifications = () => {
  return (
    <div className='relative group/menu px-15'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className='relative'>
            <span className='relative after:absolute after:w-10 after:h-10 after:rounded-full hover:text-primary after:-top-1/2 hover:after:bg-lightprimary rounded-full flex justify-center items-center cursor-pointer group-hover/menu:after:bg-lightprimary group-hover/menu:text-primary'>
              <Icon icon='tabler:bell-ringing' height={20} />
            </span>
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align='end'
          className='w-screen sm:w-[300px] py-4 rounded-sm'>
          {/* Header */}
          <div className='flex items-center px-6 justify-between'>
            <h3 className='mb-0 text-lg font-semibold text-ld'>Notification</h3>
          </div>

          {/* Empty state */}
          <SimpleBar className='max-h-80 mt-3'>
            <p className='px-6 py-4 text-sm text-darklink'>No notifications</p>
          </SimpleBar>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default Notifications

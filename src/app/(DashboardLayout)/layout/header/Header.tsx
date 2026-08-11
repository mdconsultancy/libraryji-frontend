'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Icon } from '@iconify/react'
import Profile from './Profile'
import Notifications from './Notifications'
import MobileHeader from './MobileHeader'
import SidebarLayout from '../sidebar/Sidebar'
import FullLogo from '../shared/logo/FullLogo'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

const Header = () => {
  const { theme, setTheme } = useTheme()
  const [isSticky, setIsSticky] = useState(false)
  const [mobileMenu, setMobileMenu] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsSticky(true)
      } else {
        setIsSticky(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const toggleMode = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'))
  }

  return (
    <>
      <header
        className={`sticky top-0 z-2 ${
          isSticky ? 'bg-background shadow-md fixed w-full' : 'bg-transparent'
        }`}>
        <nav
          className={`rounded-none  py-4 sm:ps-6 max-w-full! sm:pe-10 dark:bg-dark flex justify-between items-center px-6`}>
          {/* Mobile app-bar — its own component, own layout, doesn't share markup with the desktop row below */}
          <div className='xl:hidden w-full -mx-6'>
            <MobileHeader onMenuClick={() => setIsOpen(true)} />
          </div>

          <div className='hidden xl:flex items-center justify-between w-full'>
            <div className='flex items-center gap-2'>
              {/* Search Icon */}

              <div className='relative'>
                <Icon
                  icon='solar:magnifer-linear'
                  width={18}
                  height={18}
                  className='absolute left-3 top-1/2 -translate-y-1/2'
                />
                <Input
                  type='text'
                  placeholder='Search...'
                  className='rounded-xl pl-10'
                />
              </div>
            </div>
            <div className='flex w-full justify-end items-end'>
              <div className='flex gap-0 items-center '>
                {/* ✅ Dark/Light Toggle */}
                <div
                  className='hover:text-primary px-15 group focus:ring-0 rounded-full flex justify-center items-center cursor-pointer text-gray relative'
                  onClick={toggleMode}>
                  <span className='flex items-center justify-center relative after:absolute after:w-10 after:h-10 after:rounded-full after:-top-1/2   group-hover:after:bg-lightprimary'>
                    {theme === 'light' ? (
                      <Icon icon='tabler:moon' width='20' />
                    ) : (
                      <Icon
                        icon='solar:sun-bold-duotone'
                        width='20'
                        className='group-hover:text-primary'
                      />
                    )}
                  </span>
                </div>

                <div className='xl:block '>
                  <div className='flex gap-0 items-center relative'>
                    {/* Chat */}
                    <Notifications />
                  </div>
                </div>

                {/* Profile Dropdown */}
                <Profile />
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side='left' className='w-64 p-0'>
          <VisuallyHidden>
            <SheetTitle>sidebar</SheetTitle>
          </VisuallyHidden>
          <SidebarLayout onClose={() => setIsOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}

export default Header

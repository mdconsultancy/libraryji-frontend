'use client'

import { Icon } from '@iconify/react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

const WHATSAPP_NUMBERS = ['+91 70697 63365', '+91 99829 25680']
const SUPPORT_EMAILS = ['support@libraryji.in', 'libraryji54@gmail.com']

const toWaLink = (number: string) => `https://wa.me/${number.replace(/[^0-9]/g, '')}`
const toTelLink = (number: string) => `tel:${number.replace(/\s/g, '')}`

/**
 * "Need Help / Support" entry point — click-to-chat WhatsApp, click-to-call,
 * and support email, all in one place. Same component is used in both the
 * desktop header and the mobile app-bar so the contact list stays in sync.
 */
const SupportButton = ({ className = '' }: { className?: string }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Need help / Support"
          title="Need Help / Support"
          className={`h-9 w-9 flex items-center justify-center rounded-full text-link dark:text-darklink hover:bg-lightprimary hover:text-primary ${className}`}
        >
          <Icon icon="solar:chat-round-call-bold-duotone" height={20} width={20} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Need Help?</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {WHATSAPP_NUMBERS.map((number) => (
          <DropdownMenuItem key={`wa-${number}`} asChild>
            <a href={toWaLink(number)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
              <Icon icon="ic:baseline-whatsapp" width={16} height={16} className="text-success" />
              WhatsApp {number}
            </a>
          </DropdownMenuItem>
        ))}
        {WHATSAPP_NUMBERS.map((number) => (
          <DropdownMenuItem key={`call-${number}`} asChild>
            <a href={toTelLink(number)} className="flex items-center gap-2">
              <Icon icon="solar:phone-calling-bold-duotone" width={16} height={16} className="text-primary" />
              Call {number}
            </a>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {SUPPORT_EMAILS.map((email) => (
          <DropdownMenuItem key={email} asChild>
            <a href={`mailto:${email}`} className="flex items-center gap-2">
              <Icon icon="solar:letter-bold-duotone" width={16} height={16} className="text-warning" />
              {email}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default SupportButton

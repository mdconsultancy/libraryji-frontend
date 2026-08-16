'use client'

import { Icon } from '@iconify/react'
import CardBox from '@/app/components/shared/CardBox'

const WHATSAPP_NUMBERS = ['+91 70697 63365', '+91 99829 25680']
const SUPPORT_EMAILS = ['support@libraryji.in', 'libraryji54@gmail.com']

const toWaLink = (number: string) => `https://wa.me/${number.replace(/[^0-9]/g, '')}`
const toTelLink = (number: string) => `tel:${number.replace(/\s/g, '')}`

// Placeholder until real tutorial links are ready — swap `href` for each once available.
const HELP_VIDEOS = [
  { title: 'Getting Started with LibraryJi', comingSoon: true },
  { title: 'Managing Seats & Halls', comingSoon: true },
  { title: 'Members & Subscriptions', comingSoon: true },
  { title: 'Payments & Billing', comingSoon: true },
]

const FAQS = [
  {
    q: 'How do I add a new member?',
    a: 'Go to Members from the sidebar, click "Add Member", fill in their details and assign a plan/seat.',
  },
  {
    q: 'How do I set up seats and halls?',
    a: 'Go to Halls to create a hall, then Seats to generate seats (with a prefix, start number and count) — either inside a hall or unassigned.',
  },
  {
    q: 'How do I change my library address, GST number or other details?',
    a: 'Go to Settings from the sidebar — your library details can be updated there anytime.',
  },
  {
    q: 'How do I upgrade or change my subscription plan?',
    a: 'Go to your plan/billing section from the sidebar to view available plans and upgrade.',
  },
  {
    q: 'Who do I contact for support?',
    a: 'Use WhatsApp, call or email from the contact options on this page — our team typically replies within a few hours.',
  },
]

const HelpPage = () => {
  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h4 className='text-2xl font-bold text-dark dark:text-white mb-1'>Help & Support</h4>
        <p className='text-sm text-darklink'>Guides, videos and ways to reach us if you get stuck.</p>
      </div>

      {/* Contact */}
      <CardBox className='p-4 sm:p-6'>
        <h5 className='text-lg font-semibold text-dark dark:text-white mb-4 flex items-center gap-2'>
          <Icon icon='solar:chat-round-call-bold-duotone' width={22} height={22} className='text-primary' />
          Contact Us
        </h5>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          {WHATSAPP_NUMBERS.map((number) => (
            <a
              key={`wa-${number}`}
              href={toWaLink(number)}
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium hover:bg-lightsuccess hover:border-success/40 transition-colors'
            >
              <Icon icon='ic:baseline-whatsapp' width={20} height={20} className='text-success shrink-0' />
              WhatsApp {number}
            </a>
          ))}
          {WHATSAPP_NUMBERS.map((number) => (
            <a
              key={`call-${number}`}
              href={toTelLink(number)}
              className='flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium hover:bg-lightprimary hover:border-primary/40 transition-colors'
            >
              <Icon icon='solar:phone-calling-bold-duotone' width={20} height={20} className='text-primary shrink-0' />
              Call {number}
            </a>
          ))}
          {SUPPORT_EMAILS.map((email) => (
            <a
              key={email}
              href={`mailto:${email}`}
              className='flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium hover:bg-lightwarning hover:border-warning/40 transition-colors'
            >
              <Icon icon='solar:letter-bold-duotone' width={20} height={20} className='text-warning shrink-0' />
              {email}
            </a>
          ))}
        </div>
      </CardBox>

      {/* Videos */}
      <CardBox className='p-4 sm:p-6'>
        <h5 className='text-lg font-semibold text-dark dark:text-white mb-4 flex items-center gap-2'>
          <Icon icon='mdi:youtube' width={24} height={24} className='text-error' />
          Video Tutorials
        </h5>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          {HELP_VIDEOS.map((video) => (
            <div
              key={video.title}
              className='flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3'
            >
              <div className='flex items-center gap-3'>
                <div className='h-10 w-10 rounded-lg bg-lighterror flex items-center justify-center shrink-0'>
                  <Icon icon='mdi:youtube' width={22} height={22} className='text-error' />
                </div>
                <div>
                  <p className='text-sm font-medium text-dark dark:text-white'>{video.title}</p>
                  <p className='text-xs text-darklink'>Coming soon</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardBox>

      {/* FAQs */}
      <CardBox className='p-4 sm:p-6'>
        <h5 className='text-lg font-semibold text-dark dark:text-white mb-4 flex items-center gap-2'>
          <Icon icon='solar:question-circle-bold-duotone' width={22} height={22} className='text-primary' />
          Frequently Asked Questions
        </h5>
        <div className='flex flex-col divide-y divide-border'>
          {FAQS.map((item) => (
            <div key={item.q} className='py-4 first:pt-0 last:pb-0'>
              <p className='text-sm font-semibold text-dark dark:text-white mb-1'>{item.q}</p>
              <p className='text-sm text-darklink'>{item.a}</p>
            </div>
          ))}
        </div>
      </CardBox>
    </div>
  )
}

export default HelpPage

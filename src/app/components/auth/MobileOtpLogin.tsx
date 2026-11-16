'use client'

import { useState, FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { useBranding } from '@/context/BrandingContext'
import { api, ApiError, type TokenPair } from '@/lib/api'
import type { User } from '@/types'

type Channel = 'sms' | 'whatsapp'
type Step = 'phone' | 'otp' | 'library_code' | 'register'
type LoggedIn = { status: 'logged_in'; user: User } & TokenPair
type VerifyResponse =
  | LoggedIn
  | { status: 'library_code_required' | 'new_user'; ticket: string; phone: string; message?: string }

const CHANNEL_LABEL: Record<Channel, string> = { sms: 'SMS', whatsapp: 'WhatsApp' }

/**
 * Mobile-number sign-in / sign-up (MSG91 OTP). One flow for every role —
 * mirrors the mobile app: phone -> OTP -> (staff: Library Code | new number:
 * library + owner name) -> signed in. Channels come from Platform Settings.
 */
export default function MobileOtpLogin({ onSuccess }: { onSuccess: () => void }) {
  const { completeOtpLogin } = useAuth()
  const { otpChannels } = useBranding()

  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [channel, setChannel] = useState<Channel>(otpChannels[0] ?? 'sms')
  const [requestId, setRequestId] = useState('')
  const [otp, setOtp] = useState('')
  const [ticket, setTicket] = useState('')
  const [libraryCode, setLibraryCode] = useState('')
  const [libraryName, setLibraryName] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const run = async (fn: () => Promise<void>) => {
    setError(null)
    setBusy(true)
    try {
      await fn()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const finish = async (res: LoggedIn) => {
    await completeOtpLogin(res)
    onSuccess()
  }

  const sendOtp = (via: Channel) =>
    run(async () => {
      const res = await api.post<{ request_id: string; message: string }>('/auth/otp/send', { phone, channel: via })
      setChannel(via)
      setRequestId(res.request_id)
      setOtp('')
      setInfo(res.message)
      setStep('otp')
    })

  const verify = (e: FormEvent) => {
    e.preventDefault()
    return run(async () => {
      const res = await api.post<VerifyResponse>('/auth/otp/verify', { request_id: requestId, otp })
      if (res.status === 'logged_in') return finish(res)
      setTicket(res.ticket)
      setInfo(res.message ?? null)
      setStep(res.status === 'new_user' ? 'register' : 'library_code')
    })
  }

  const submitStaff = (e: FormEvent) => {
    e.preventDefault()
    return run(async () => {
      await finish(await api.post<LoggedIn>('/auth/otp/staff', { ticket, library_code: libraryCode }))
    })
  }

  const submitRegister = (e: FormEvent) => {
    e.preventDefault()
    return run(async () => {
      await finish(await api.post<LoggedIn>('/auth/otp/register', { ticket, library_name: libraryName, name }))
    })
  }

  const banner = (
    <>
      {error && <div className='mb-4 rounded-md bg-lighterror px-3 py-2 text-sm text-error'>{error}</div>}
      {!error && info && <div className='mb-4 rounded-md bg-lightprimary px-3 py-2 text-sm text-charcoal'>{info}</div>}
    </>
  )

  const back = (
    <button
      type='button'
      onClick={() => {
        setStep('phone')
        setError(null)
        setInfo(null)
      }}
      className='mt-4 w-full text-center text-sm font-medium text-link dark:text-darklink hover:text-primary'
    >
      Change mobile number
    </button>
  )

  if (step === 'otp') {
    return (
      <form onSubmit={verify}>
        {banner}
        <p className='text-xs text-darklink text-center mb-3'>Enter the 6-digit code sent to +91 {phone}</p>
        <Input
          type='text'
          inputMode='numeric'
          autoComplete='one-time-code'
          placeholder='6-digit code'
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className='mb-4 text-center tracking-[0.5em] text-lg'
          maxLength={6}
          autoFocus
          required
        />
        <Button className='w-full' type='submit' disabled={busy || otp.length < 4}>
          {busy ? 'Verifying...' : 'Verify & Sign In'}
        </Button>
        <button
          type='button'
          disabled={busy}
          onClick={() => sendOtp(channel)}
          className='mt-4 w-full text-center text-sm font-medium text-primary disabled:opacity-50'
        >
          Resend code
        </button>
        {back}
      </form>
    )
  }

  if (step === 'library_code') {
    return (
      <form onSubmit={submitStaff}>
        {banner}
        <Input
          type='text'
          placeholder='Library Code (e.g. A4X9K)'
          value={libraryCode}
          onChange={(e) => setLibraryCode(e.target.value.toUpperCase())}
          className='mb-4 uppercase tracking-wider'
          maxLength={10}
          autoFocus
          required
        />
        <Button className='w-full' type='submit' disabled={busy || !libraryCode}>
          {busy ? 'Signing in...' : 'Sign In'}
        </Button>
        {back}
      </form>
    )
  }

  if (step === 'register') {
    return (
      <form onSubmit={submitRegister}>
        {banner}
        <p className='text-xs text-darklink text-center mb-3'>New here? Create your library — it only takes a moment.</p>
        <Input className='mb-4' placeholder='Library name' value={libraryName} onChange={(e) => setLibraryName(e.target.value)} required autoFocus />
        <Input className='mb-4' placeholder='Your full name' value={name} onChange={(e) => setName(e.target.value)} required />
        <Button className='w-full' type='submit' disabled={busy || !libraryName.trim() || !name.trim()}>
          {busy ? 'Creating...' : 'Create Library & Continue'}
        </Button>
        {back}
      </form>
    )
  }

  const channels: Channel[] = otpChannels.length ? otpChannels : ['sms']
  const valid = phone.replace(/\D/g, '').length >= 10

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (channels.length === 1) sendOtp(channels[0])
      }}
    >
      {banner}
      <div className='mb-4 flex'>
        <span className='inline-flex items-center rounded-l-md border border-r-0 border-border px-3 text-sm text-darklink'>+91</span>
        <Input
          type='tel'
          inputMode='numeric'
          autoComplete='tel-national'
          placeholder='Enter mobile number'
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/[^\d+\s-]/g, '').slice(0, 16))}
          className='rounded-l-none'
          autoFocus
          required
        />
      </div>
      {channels.length === 1 ? (
        <Button className='w-full' type='submit' disabled={busy || !valid}>
          {busy ? 'Sending...' : `Get OTP on ${CHANNEL_LABEL[channels[0]]}`}
        </Button>
      ) : (
        <div className='flex flex-col gap-2'>
          {channels.map((c, i) => (
            <Button
              key={c}
              type='button'
              variant={i === 0 ? 'default' : 'outline'}
              disabled={busy || !valid}
              onClick={() => sendOtp(c)}
            >
              {busy ? 'Sending...' : `Get OTP on ${CHANNEL_LABEL[c]}`}
            </Button>
          ))}
        </div>
      )}
    </form>
  )
}

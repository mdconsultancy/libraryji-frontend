'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import FullLogo from '@/app/(DashboardLayout)/layout/shared/logo/FullLogo'
import CardBox from '../shared/CardBox'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PasswordInput from '@/components/form/PasswordInput'
import { api, ApiError } from '@/lib/api'

type Step = 'email' | 'staff' | 'code' | 'password' | 'done'

export const ForgotPassword = () => {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const handleSendCode = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const response = await api.post<{ message: string; is_staff: boolean }>('/auth/forgot-password', { email })
      setStep(response.is_staff ? 'staff' : 'code')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    setError(null)
    try {
      await api.post('/auth/forgot-password', { email })
    } catch {
      // best-effort — the original code is still valid, no need to block on this
    } finally {
      setResending(false)
    }
  }

  const handleContinueWithCode = (e: FormEvent) => {
    e.preventDefault()
    if (code.trim().length !== 6) return
    setStep('password')
  }

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    setLoading(true)
    try {
      await api.post('/auth/reset-password', {
        email,
        code: code.trim(),
        password,
        password_confirmation: passwordConfirmation,
      })
      setStep('done')
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.errors || {})
        setError(err.message)
        // A wrong/expired code surfaces here (there's no separate verify-only
        // endpoint) — send them back to the code step instead of leaving them
        // stuck re-submitting a password against a code that'll never work.
        if (err.errors?.code) setStep('code')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const stepNumber = { email: 1, staff: 1, code: 2, password: 3, done: 3 }[step]

  return (
    <div className='min-h-screen w-full flex justify-center items-center bg-lightprimary px-3'>
      <div className='w-full max-w-[450px] mx-auto'>
        <CardBox className='p-4 sm:p-6'>
          <div className='flex justify-center mb-4'>
            <FullLogo />
          </div>

          {step !== 'staff' && step !== 'done' && (
            <div className='flex items-center justify-center gap-2 mb-6'>
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className={`h-1.5 w-10 rounded-full transition-colors ${n <= stepNumber ? 'bg-primary' : 'bg-lightprimary border border-border'}`}
                />
              ))}
            </div>
          )}

          {step === 'email' && (
            <>
              <p className='text-sm text-charcoal text-center mb-6'>
                Enter your email and we&apos;ll send you a code to reset your password.
              </p>
              <form onSubmit={handleSendCode} className='flex flex-col gap-4'>
                {error && <div className='rounded-md bg-lighterror px-3 py-2 text-sm text-error'>{error}</div>}
                <Input
                  id='email'
                  type='email'
                  placeholder='Enter your email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
                <Button className='w-full' type='submit' disabled={loading}>
                  {loading ? 'Sending...' : 'Send code'}
                </Button>
                <Link href='/auth/login' className='text-center text-sm font-medium text-link dark:text-darklink hover:text-primary'>
                  Back to sign in
                </Link>
              </form>
            </>
          )}

          {step === 'staff' && (
            <div className='flex flex-col gap-4'>
              <div className='rounded-md bg-lightwarning px-3 py-3 text-sm text-warning'>
                You&apos;re a staff account — please ask your library admin to reset your password for you.
              </div>
              <Link href='/auth/login' className='text-center text-sm font-medium text-link dark:text-darklink hover:text-primary'>
                Back to sign in
              </Link>
            </div>
          )}

          {step === 'code' && (
            <>
              <p className='text-sm text-charcoal text-center mb-6'>
                Enter the 6-digit code we sent to <span className='font-medium'>{email}</span>.
              </p>
              <form onSubmit={handleContinueWithCode} className='flex flex-col gap-4'>
                <Input
                  id='code'
                  type='text'
                  inputMode='numeric'
                  placeholder='6-digit code'
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className='text-center tracking-[0.5em]'
                  maxLength={6}
                  required
                  autoFocus
                />
                <Button className='w-full' type='submit' disabled={code.length !== 6}>
                  Next
                </Button>
                <div className='flex items-center justify-center gap-2'>
                  <button
                    type='button'
                    onClick={handleResend}
                    disabled={resending}
                    className='text-sm font-medium text-primary hover:text-primaryemphasis disabled:opacity-50'
                  >
                    {resending ? 'Resending...' : 'Resend code'}
                  </button>
                  <span className='text-darklink'>·</span>
                  <button
                    type='button'
                    onClick={() => setStep('email')}
                    className='text-sm font-medium text-link dark:text-darklink hover:text-primary'
                  >
                    Change email
                  </button>
                </div>
              </form>
            </>
          )}

          {step === 'password' && (
            <>
              <p className='text-sm text-charcoal text-center mb-6'>Choose a new password.</p>
              <form onSubmit={handleResetPassword} className='flex flex-col gap-4'>
                {error && <div className='rounded-md bg-lighterror px-3 py-2 text-sm text-error'>{error}</div>}
                <div className='flex flex-col gap-2'>
                  <PasswordInput
                    id='password'
                    placeholder='New password'
                    value={password}
                    onChange={setPassword}
                    autoComplete='new-password'
                    showStrength
                    required
                  />
                  {fieldErrors.password && <p className='text-xs text-error'>{fieldErrors.password[0]}</p>}
                </div>
                <PasswordInput
                  id='password_confirmation'
                  placeholder='Confirm new password'
                  value={passwordConfirmation}
                  onChange={setPasswordConfirmation}
                  autoComplete='new-password'
                  required
                />
                <Button className='w-full' type='submit' disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset password'}
                </Button>
                <button
                  type='button'
                  onClick={() => setStep('code')}
                  className='text-center text-sm font-medium text-link dark:text-darklink hover:text-primary'
                >
                  Back
                </button>
              </form>
            </>
          )}

          {step === 'done' && (
            <div className='flex flex-col gap-4'>
              <div className='rounded-md bg-lightsuccess px-3 py-3 text-sm text-success'>
                Your password has been reset. You can sign in now.
              </div>
              <Button className='w-full' onClick={() => router.push('/auth/login')}>
                Go to sign in
              </Button>
            </div>
          )}
        </CardBox>
      </div>
    </div>
  )
}

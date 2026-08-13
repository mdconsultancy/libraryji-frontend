'use client'

import { useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import FullLogo from '@/app/(DashboardLayout)/layout/shared/logo/FullLogo'
import CardBox from '../shared/CardBox'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PasswordInput from '@/components/form/PasswordInput'
import { api, ApiError } from '@/lib/api'

export const ResetPassword = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') ?? '')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    setLoading(true)
    try {
      await api.post('/auth/reset-password', {
        email,
        code,
        password,
        password_confirmation: passwordConfirmation,
      })
      setDone(true)
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.errors || {})
        setError(err.message)
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen w-full flex justify-center items-center bg-lightprimary px-3'>
      <div className='w-full max-w-[450px] mx-auto'>
        <CardBox className='p-4 sm:p-6'>
          <div className='flex justify-center mb-4'>
            <FullLogo />
          </div>
          <p className='text-sm text-charcoal text-center mb-6'>
            Enter the code we emailed you and choose a new password.
          </p>

          {done ? (
            <div className='flex flex-col gap-4'>
              <div className='rounded-md bg-lightsuccess px-3 py-3 text-sm text-success'>
                Your password has been reset. You can sign in now.
              </div>
              <Button className='w-full' onClick={() => router.push('/auth/login')}>
                Go to sign in
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
              {error && <div className='rounded-md bg-lighterror px-3 py-2 text-sm text-error'>{error}</div>}
              <div className='flex flex-col gap-2'>
                <Input
                  id='email'
                  type='email'
                  placeholder='Enter your email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {fieldErrors.email && <p className='text-xs text-error'>{fieldErrors.email[0]}</p>}
              </div>
              <div className='flex flex-col gap-2'>
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
                />
                {fieldErrors.code && <p className='text-xs text-error'>{fieldErrors.code[0]}</p>}
              </div>
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
              <div className='flex flex-col gap-2'>
                <PasswordInput
                  id='password_confirmation'
                  placeholder='Confirm new password'
                  value={passwordConfirmation}
                  onChange={setPasswordConfirmation}
                  autoComplete='new-password'
                  required
                />
              </div>
              <Button className='w-full' type='submit' disabled={loading}>
                {loading ? 'Resetting...' : 'Reset password'}
              </Button>
              <Link href='/auth/login' className='text-center text-sm font-medium text-link dark:text-darklink hover:text-primary'>
                Back to sign in
              </Link>
            </form>
          )}
        </CardBox>
      </div>
    </div>
  )
}

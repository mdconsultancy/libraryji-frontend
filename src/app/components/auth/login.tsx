'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import FullLogo from '@/app/(DashboardLayout)/layout/shared/logo/FullLogo'
import CardBox from '../shared/CardBox'
import PolicyLinks from '../shared/PolicyLinks'
import Link from 'next/link'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PasswordInput from '@/components/form/PasswordInput'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/lib/api'
import AuthImagePanel from './AuthImagePanel'

export const Login = () => {
  const { login, verifyTwoFactor, resendTwoFactor } = useAuth()
  const router = useRouter()
  const [loginType, setLoginType] = useState<'admin' | 'staff'>('admin')
  const [libraryCode, setLibraryCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(false)

  // Set once login() comes back with two_factor_required — switches the form
  // over to the OTP step instead of navigating home.
  const [pendingUserId, setPendingUserId] = useState<number | null>(null)
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    setLoading(true)
    try {
      const result = await login({ library_code: loginType === 'staff' ? libraryCode : undefined, email, password })
      if (result.twoFactorRequired) {
        setPendingUserId(result.userId)
      } else {
        router.push('/')
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.errors || {})
        setError(err.errors?.library_code?.[0] || err.errors?.email?.[0] || err.message)
      } else {
        setError('Unable to sign in. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault()
    if (!pendingUserId) return
    setOtpError(null)
    setVerifying(true)
    try {
      await verifyTwoFactor(pendingUserId, otp)
      router.push('/')
    } catch (err) {
      setOtpError(err instanceof ApiError ? err.message : 'Unable to verify that code. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  const handleResendOtp = async () => {
    if (!pendingUserId) return
    setResending(true)
    setOtpError(null)
    try {
      await resendTwoFactor(pendingUserId)
    } catch {
      setOtpError('Unable to resend the code. Please try again.')
    } finally {
      setResending(false)
    }
  }

  if (pendingUserId) {
    return (
      <div className='min-h-screen w-full flex bg-lightprimary'>
        <AuthImagePanel variant='login' />
        <div className='w-full lg:w-[40%] flex justify-center items-center px-3 py-10'>
        <div className='w-full max-w-[450px] mx-auto'>
          <CardBox className='p-4 sm:p-6'>
            <form onSubmit={handleVerifyOtp}>
              <div className='flex justify-center mb-4'>
                <FullLogo />
              </div>
              <p className='text-sm text-charcoal text-center mb-1'>Two-factor verification</p>
              <p className='text-xs text-darklink text-center mb-6'>
                We&apos;ve emailed a 6-digit code to {email}. Enter it below to finish signing in.
              </p>

              {otpError && (
                <div className='mb-4 rounded-md bg-lighterror px-3 py-2 text-sm text-error'>{otpError}</div>
              )}

              <div className='mb-4'>
                <Input
                  id='otp'
                  type='text'
                  inputMode='numeric'
                  placeholder='6-digit code'
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className='text-center tracking-[0.5em] text-lg'
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>

              <Button className='w-full' type='submit' disabled={verifying || otp.length !== 6}>
                {verifying ? 'Verifying...' : 'Verify & Sign In'}
              </Button>

              <div className='flex items-center justify-center gap-2 mt-6'>
                <button
                  type='button'
                  onClick={handleResendOtp}
                  disabled={resending}
                  className='text-sm font-medium text-primary hover:text-primaryemphasis disabled:opacity-50'
                >
                  {resending ? 'Resending...' : 'Resend code'}
                </button>
                <span className='text-darklink'>·</span>
                <button
                  type='button'
                  onClick={() => {
                    setPendingUserId(null)
                    setOtp('')
                    setOtpError(null)
                  }}
                  className='text-sm font-medium text-link dark:text-darklink hover:text-primary'
                >
                  Back to sign in
                </button>
              </div>
            </form>
          </CardBox>
          <PolicyLinks />
        </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className='min-h-screen w-full flex bg-lightprimary'>
        <AuthImagePanel variant='login' />
        <div className='w-full lg:w-[40%] flex justify-center items-center px-3 py-10'>
        <div className='w-full max-w-[450px] mx-auto'>
          <CardBox className='p-4 sm:p-6'>
            <form onSubmit={handleSubmit}>
              <div className='flex justify-center mb-4'>
                <FullLogo />
              </div>
              <p className='text-sm text-charcoal text-center mb-6'>
                Sign in to your library dashboard
              </p>

              <div className='mb-6 grid grid-cols-2 rounded-lg bg-lightprimary p-1'>
                <button
                  type='button'
                  onClick={() => setLoginType('admin')}
                  className={`rounded-md py-2 text-sm font-medium transition-colors ${
                    loginType === 'admin' ? 'bg-white dark:bg-dark text-primary shadow-xs' : 'text-link dark:text-darklink'
                  }`}
                >
                  Admin Login
                </button>
                <button
                  type='button'
                  onClick={() => setLoginType('staff')}
                  className={`rounded-md py-2 text-sm font-medium transition-colors ${
                    loginType === 'staff' ? 'bg-white dark:bg-dark text-primary shadow-xs' : 'text-link dark:text-darklink'
                  }`}
                >
                  Staff Login
                </button>
              </div>

              {error && (
                <div className='mb-4 rounded-md bg-lighterror px-3 py-2 text-sm text-error'>
                  {error}
                </div>
              )}

              {loginType === 'staff' && (
                <div className='mb-4'>
                  <Input
                    id='library_code'
                    type='text'
                    placeholder='Library Code (e.g. A4X9K)'
                    value={libraryCode}
                    onChange={(e) => setLibraryCode(e.target.value.toUpperCase())}
                    className='uppercase tracking-wider'
                    maxLength={10}
                    required
                  />
                  {fieldErrors.library_code && (
                    <p className='text-xs text-error mt-1'>{fieldErrors.library_code[0]}</p>
                  )}
                </div>
              )}
              <div className='mb-4'>
                <Input
                  id='email1'
                  type='email'
                  placeholder='Enter your email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className='mb-4'>
                <PasswordInput
                  id='password1'
                  placeholder='Enter your password'
                  value={password}
                  onChange={setPassword}
                  autoComplete='current-password'
                  required
                />
              </div>
              <div className='flex flex-wrap gap-6 items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Checkbox
                    id='remember'
                    checked={remember}
                    onCheckedChange={(checked) => setRemember(checked === true)}
                  />
                  <Label
                    className='text-link font-normal text-sm'
                    htmlFor='remember'>
                    Remember this device
                  </Label>
                </div>
                <Link
                  href='/auth/forgot-password'
                  className='text-sm font-medium text-primary hover:text-primaryemphasis'>
                  Forgot password?
                </Link>
              </div>
              <Button className='w-full' type='submit' disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
              <div className='flex items center gap-2 justify-center mt-6 flex-wrap'>
                <p className='text-base font-medium text-link dark:text-darklink'>
                  New to LibraryJi?
                </p>
                <Link
                  href='/auth/register'
                  className='text-sm font-medium text-primary hover:text-primaryemphasis'>
                  Create an account
                </Link>
              </div>
            </form>
          </CardBox>
          <PolicyLinks />
        </div>
        </div>
      </div>
    </>
  )
}

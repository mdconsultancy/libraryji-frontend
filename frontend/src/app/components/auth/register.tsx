'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import FullLogo from '@/app/(DashboardLayout)/layout/shared/logo/FullLogo'
import CardBox from '../shared/CardBox'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/lib/api'

interface FormState {
  library_name: string
  name: string
  email: string
  phone: string
  city: string
  state: string
  password: string
  password_confirmation: string
}

const initialState: FormState = {
  library_name: '',
  name: '',
  email: '',
  phone: '',
  city: '',
  state: '',
  password: '',
  password_confirmation: '',
}

export const Register = () => {
  const { register } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState<FormState>(initialState)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(false)

  const update = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    setLoading(true)
    try {
      await register(form)
      // Tenant starts payment-pending; the dashboard layout guard routes
      // straight to plan selection + Razorpay checkout at /select-plan —
      // that's the one place a plan actually gets chosen and paid for, so
      // registration itself no longer asks for a plan up front.
      router.push('/')
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
        setFieldErrors(err.errors || {})
      } else {
        setError('Unable to create your account. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const fieldError = (field: string) => fieldErrors[field]?.[0]

  return (
    <>
      <div className='h-screen w-full flex justify-center items-center bg-lightprimary py-10'>
        <div className='w-[92%] max-w-[500px] mx-auto md:w-full md:min-w-[500px]'>
          <CardBox>
            <form onSubmit={handleSubmit}>
              <div className='flex justify-center mb-4'>
                <FullLogo />
              </div>
              <p className='text-sm text-charcoal text-center mb-6'>
                Create your library account — choose a plan and pay on the next step
              </p>

              {error && (
                <div className='mb-4 rounded-md bg-lighterror px-3 py-2 text-sm text-error'>
                  <p>{error}</p>
                  {error.includes('awaiting payment') && (
                    <Link href='/auth/login' className='inline-block mt-1 font-medium underline hover:text-primaryemphasis'>
                      Go to Sign In
                    </Link>
                  )}
                </div>
              )}

              <div className='mb-4'>
                <Input
                  id='library_name'
                  type='text'
                  placeholder='Library Name'
                  value={form.library_name}
                  onChange={update('library_name')}
                  required
                />
                {fieldError('library_name') && (
                  <p className='text-xs text-error mt-1'>{fieldError('library_name')}</p>
                )}
              </div>

              <div className='mb-4'>
                <Input
                  id='name1'
                  type='text'
                  placeholder='Your Name'
                  value={form.name}
                  onChange={update('name')}
                  required
                />
                {fieldError('name') && <p className='text-xs text-error mt-1'>{fieldError('name')}</p>}
              </div>

              <div className='grid grid-cols-2 gap-4 mb-4'>
                <div>
                  <Input
                    id='email1'
                    type='email'
                    placeholder='Email'
                    value={form.email}
                    onChange={update('email')}
                    required
                  />
                  {fieldError('email') && <p className='text-xs text-error mt-1'>{fieldError('email')}</p>}
                </div>
                <div>
                  <Input
                    id='phone1'
                    type='tel'
                    placeholder='Phone'
                    value={form.phone}
                    onChange={update('phone')}
                    required
                  />
                  {fieldError('phone') && <p className='text-xs text-error mt-1'>{fieldError('phone')}</p>}
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4 mb-4'>
                <div>
                  <Input
                    id='city1'
                    type='text'
                    placeholder='City'
                    value={form.city}
                    onChange={update('city')}
                  />
                </div>
                <div>
                  <Input
                    id='state1'
                    type='text'
                    placeholder='State'
                    value={form.state}
                    onChange={update('state')}
                  />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4 mb-4'>
                <div>
                  <Input
                    id='password1'
                    type='password'
                    placeholder='Password'
                    value={form.password}
                    onChange={update('password')}
                    required
                  />
                  {fieldError('password') && (
                    <p className='text-xs text-error mt-1'>{fieldError('password')}</p>
                  )}
                </div>
                <div>
                  <Input
                    id='password_confirmation1'
                    type='password'
                    placeholder='Confirm Password'
                    value={form.password_confirmation}
                    onChange={update('password_confirmation')}
                    required
                  />
                </div>
              </div>

              <Button className='w-full' type='submit' disabled={loading}>
                {loading ? 'Creating account...' : 'Continue to Plan & Payment'}
              </Button>
              <div className='flex items center gap-2 justify-center mt-6 flex-wrap'>
                <p className='text-base font-medium text-link dark:text-darklink'>
                  Already have an account?
                </p>
                <Link
                  href='/auth/login'
                  className='text-sm font-medium text-primary hover:text-primaryemphasis'>
                  Sign In
                </Link>
              </div>
            </form>
          </CardBox>
        </div>
      </div>
    </>
  )
}

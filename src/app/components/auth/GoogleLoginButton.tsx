'use client'

import { useState, FormEvent } from 'react'
import useSWR from 'swr'
import { GoogleOAuthProvider, GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { swrFetcher } from '@/lib/swr'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface PublicOAuthConfig {
  google_login_enabled?: boolean
  google_client_id?: string
}

interface GoogleLoginButtonProps {
  /** Called after a successful Google sign-in/sign-up — same redirect the caller
   *  already does for a normal email/password login. */
  onSuccess: () => void
  onError: (message: string) => void
  /** 'register' shows sign-up-flavored copy/button text; 'login' is the default. */
  variant?: 'login' | 'register'
  /**
   * 'staff' routes the Google credential through the Library-Code modal and
   * POSTs /auth/google/staff instead of /auth/google — for the Staff tab on
   * the login page, where Google sign-in is gated by a Library Code (see
   * AuthController::googleStaff()). Defaults to 'admin', the original
   * behavior (no modal, straight to /auth/google).
   */
  mode?: 'admin' | 'staff'
}

/**
 * "Continue with Google" button for the Login and Register screens.
 *
 * Uses @react-oauth/google (thin wrapper around Google Identity Services) to get a
 * client-side ID token, then hands it to AuthContext.loginWithGoogle(), which POSTs
 * it to /auth/google and treats the response exactly like a normal login/register.
 *
 * The Client ID is public/expected to be exposed client-side. This piggybacks on the
 * public `/theme` endpoint (already fetched app-wide by BrandingContext, so this SWR
 * call dedupes against that one) in case the backend folds `google_client_id` /
 * `google_login_enabled` into that response. If the backend hasn't done that yet, it
 * falls back to NEXT_PUBLIC_GOOGLE_CLIENT_ID and always renders the button (per the
 * "don't block on this" fallback) — see the OAuth rollout report for this gap.
 */
export default function GoogleLoginButton({ onSuccess, onError, variant = 'login', mode = 'admin' }: GoogleLoginButtonProps) {
  const { loginWithGoogle, loginStaffWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)

  // Staff flow only: the Google credential from a successful GoogleLogin
  // callback, held here while the Library Code modal is open. Nothing is
  // sent to the backend (and no tokens exist) until the code is submitted —
  // canceling the modal just drops this and leaves no half-authenticated
  // state behind.
  const [pendingCredential, setPendingCredential] = useState<string | null>(null)
  const [libraryCode, setLibraryCode] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)
  const [submittingCode, setSubmittingCode] = useState(false)

  const { data, isLoading: configLoading } = useSWR<PublicOAuthConfig>('/theme', swrFetcher, { revalidateOnFocus: false })

  const clientId = data?.google_client_id || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  // Hide only when the backend explicitly says Google login is off. If the flag isn't
  // in the response yet (backend not wired up), default to showing the button.
  const enabled = data?.google_login_enabled !== false

  // The /theme fetch (and then Google's own script) takes a beat, during
  // which this used to render nothing at all — a blank gap that looked
  // broken. Show a same-sized skeleton in its place instead, so the layout
  // holds still and it's obviously "still loading", not "missing".
  if (configLoading) {
    return (
      <div className="flex flex-col items-center gap-3 w-full">
        <div className="flex items-center gap-3 w-full">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs text-darklink">OR</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="h-10 w-[360px] max-w-full animate-pulse rounded-full bg-lightprimary dark:bg-white/10" />
      </div>
    )
  }

  if (!enabled || !clientId) return null

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      onError('Google did not return a credential. Please try again.')
      return
    }

    // Staff mode: don't sign in yet — the Library Code has to be collected
    // and validated first (see AuthController::googleStaff()). Stash the
    // credential and open the modal instead of calling the API.
    if (mode === 'staff') {
      setPendingCredential(credentialResponse.credential)
      setLibraryCode('')
      setCodeError(null)
      return
    }

    setLoading(true)
    try {
      await loginWithGoogle(credentialResponse.credential)
      onSuccess()
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Unable to sign in with Google. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const closeCodeModal = () => {
    setPendingCredential(null)
    setLibraryCode('')
    setCodeError(null)
  }

  const handleSubmitCode = async (e: FormEvent) => {
    e.preventDefault()
    if (!pendingCredential) return
    setCodeError(null)
    setSubmittingCode(true)
    try {
      await loginStaffWithGoogle(pendingCredential, libraryCode)
      setPendingCredential(null)
      onSuccess()
    } catch (err) {
      if (err instanceof ApiError) {
        setCodeError(err.errors?.library_code?.[0] || err.message)
      } else {
        setCodeError('Unable to sign in with Google. Please try again.')
      }
    } finally {
      setSubmittingCode(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="flex items-center gap-3 w-full">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-darklink">OR</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <GoogleOAuthProvider clientId={clientId}>
        <div className="relative w-full flex justify-center">
          <div className={loading ? 'opacity-40 pointer-events-none' : ''}>
            {/* GSI's `width` prop wants a pixel number as a string, not a CSS
                percentage — "100%" is silently rejected (falls back to its
                default ~240px, and logs a console warning every render). 360
                comfortably fills this form's width without overflowing on
                narrow mobile viewports. */}
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => onError('Google sign-in failed. Please try again.')}
              width="360"
              text={variant === 'register' ? 'signup_with' : 'continue_with'}
            />
          </div>
          {/* Google renders its own button inside an iframe, so we can't put a
              spinner *inside* it — an overlay on top is the only way to show
              "signing in..." once the user has actually picked an account. */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-full bg-white/70 dark:bg-dark/70">
              <svg className="h-4 w-4 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm font-medium text-dark dark:text-white">Signing in...</span>
            </div>
          )}
        </div>
      </GoogleOAuthProvider>
      {variant === 'register' && (
        <p className="text-xs text-darklink text-center">
          Sign up instantly with Google — no separate registration needed.
        </p>
      )}

      {pendingCredential && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-[380px] rounded-lg bg-white dark:bg-dark p-5 shadow-lg">
            <form onSubmit={handleSubmitCode}>
              <h3 className="text-sm font-semibold text-dark dark:text-white mb-1">Enter Library Code</h3>
              <p className="text-xs text-darklink mb-4">
                Ask your library admin for your Library Code to finish signing in with Google.
              </p>

              {codeError && (
                <div className="mb-3 rounded-md bg-lighterror px-3 py-2 text-sm text-error">{codeError}</div>
              )}

              <Input
                id="google_staff_library_code"
                type="text"
                placeholder="Library Code (e.g. A4X9K)"
                value={libraryCode}
                onChange={(e) => setLibraryCode(e.target.value.toUpperCase())}
                className="uppercase tracking-wider mb-4"
                maxLength={10}
                autoFocus
                required
              />

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={closeCodeModal} disabled={submittingCode}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingCode || !libraryCode}>
                  {submittingCode ? 'Verifying...' : 'Continue'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

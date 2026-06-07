/* eslint-disable */
import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Eye, EyeSlash, WarningCircle, CheckCircle, Sparkle, EnvelopeSimple, ArrowLeft, LockKey } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { getPasswordStrength } from '../lib/passwordStrength'

type Mode = 'login' | 'register' | 'otp' | 'forgot-password' | 'reset-otp' | 'reset-password'

type AuthModalProps = {
  open: boolean
  onClose: () => void
  canClose?: boolean
  onLogin: (username: string, password: string) => Promise<void>
  onRegister: (username: string, email: string, password: string, name: string, role?: 'lady' | 'partner') => Promise<void>
  onVerifyOtp?: (code: string) => Promise<void>
  onResendOtp?: () => Promise<void>
  isLoading?: boolean
  otpMode?: boolean
  otpEmail?: string
  /** Which tab to open on — defaults to 'login' */
  initialMode?: 'login' | 'register'
  /** Name pre-filled from onboarding — hides the name field */
  preFillName?: string
  // Reset password flow
  onForgotPassword?: (email: string) => Promise<void>
  onVerifyResetOtp?: (code: string) => Promise<void>
  onResetPassword?: (newPassword: string) => Promise<void>
  resetMode?: false | 'otp' | 'new-password'
}

const OTP_RESEND_SECONDS = 30

export function AuthModal({
  open,
  onClose,
  canClose = true,
  onLogin,
  onRegister,
  onVerifyOtp,
  onResendOtp,
  isLoading,
  otpMode = false,
  otpEmail = '',
  initialMode = 'login',
  preFillName = '',
  onForgotPassword,
  onVerifyResetOtp,
  onResetPassword,
  resetMode = false,
}: AuthModalProps) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // OTP state (shared between login-OTP and reset-OTP steps)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Reset-password step state
  const [resetEmail, setResetEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)

  const [role] = useState<'lady' | 'partner'>(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('code') || sessionStorage.getItem('mf_partner_code') ? 'partner' : 'lady'
  })

  // ── Sync with external otpMode prop ─────────────────────────────────────────
  const prevOtpModeRef = useRef(otpMode)
  const otpActivatedRef = useRef(false)
  if (prevOtpModeRef.current !== otpMode) {
    prevOtpModeRef.current = otpMode
    if (otpMode) {
      setMode('otp')
      setOtpDigits(['', '', '', '', '', ''])
      otpActivatedRef.current = true
    }
  }

  // ── Sync with external resetMode prop ────────────────────────────────────────
  const prevResetModeRef = useRef(resetMode)
  if (prevResetModeRef.current !== resetMode) {
    prevResetModeRef.current = resetMode
    if (resetMode === 'otp') {
      setMode('reset-otp')
      setOtpDigits(['', '', '', '', '', ''])
      otpActivatedRef.current = true
    } else if (resetMode === 'new-password') {
      setMode('reset-password')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  const openSyncStateRef = useRef({ open, initialMode, preFillName })
  if (
    open &&
    !otpMode &&
    !resetMode &&
    (
      openSyncStateRef.current.open !== open ||
      openSyncStateRef.current.initialMode !== initialMode ||
      openSyncStateRef.current.preFillName !== preFillName
    )
  ) {
    openSyncStateRef.current = { open, initialMode, preFillName }
    setMode(initialMode)
    if (preFillName) setName(preFillName)
  } else if (openSyncStateRef.current.open !== open) {
    openSyncStateRef.current = { open, initialMode, preFillName }
  }

  // Run OTP side-effects (cooldown + focus) after OTP mode is activated
  useEffect(() => {
    if (!otpActivatedRef.current) return
    otpActivatedRef.current = false
    startResendCooldown()
    const t = setTimeout(() => inputRefs.current[0]?.focus(), 100)
    return () => clearTimeout(t)
  })

  function startResendCooldown() {
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    setResendCooldown(OTP_RESEND_SECONDS)
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current) }, [])

  // ── Credential submit ─────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setName('')
    setUsername('')
    setEmail('')
    setPassword('')
    setShowPassword(false)
    setOtpDigits(['', '', '', '', '', ''])
    setResetEmail('')
    setNewPassword('')
    setConfirmPassword('')
  }, [])

  const switchMode = useCallback((next: Mode) => {
    setMode(next)
    reset()
  }, [reset])

  const handleSubmit = useCallback(async () => {
    if (isLoading) return
    const u = username.trim()
    const p = password.trim()
    const n = name.trim()
    const e = email.trim()
    if (!u || !p) { toast.error('Please fill in all fields'); return }
    if (mode === 'register') {
      if (!n && !preFillName) { toast.error('Please enter your name'); return }
      if (!e) { toast.error('Please enter your email address'); return }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { toast.error('Please enter a valid email address'); return }
      const strength = getPasswordStrength(p)
      if (!strength?.isStrong) { toast.error('Password is too weak. Please use a stronger password.'); return }
    }
    try {
      if (mode === 'login') await onLogin(u, p)
      else await onRegister(u, e, p, n || preFillName, role)
      reset()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    }
  }, [isLoading, username, password, name, email, mode, onLogin, onRegister, preFillName, role, reset])

  // ── OTP digit input handling ───────────────────────────────────────────────
  const handleOtpChange = useCallback((index: number, value: string) => {
    if (value.length === 6 && /^\d{6}$/.test(value)) {
      setOtpDigits(value.split(''))
      inputRefs.current[5]?.focus()
      return
    }
    if (!/^\d?$/.test(value)) return
    setOtpDigits(prev => {
      const next = [...prev]
      next[index] = value
      return next
    })
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
  }, [])

  const handleOtpSubmit = useCallback(async () => {
    const code = otpDigits.join('')
    if (code.length !== 6) { toast.error('Please enter all 6 digits'); return }
    if (!onVerifyOtp) return
    try {
      await onVerifyOtp(code)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Verification failed')
      setOtpDigits(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    }
  }, [otpDigits, onVerifyOtp])

  const handleResetOtpSubmit = useCallback(async () => {
    const code = otpDigits.join('')
    if (code.length !== 6) { toast.error('Please enter all 6 digits'); return }
    if (!onVerifyResetOtp) return
    try {
      await onVerifyResetOtp(code)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Incorrect code. Please try again.')
      setOtpDigits(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    }
  }, [otpDigits, onVerifyResetOtp])

  const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'Enter') {
      if (mode === 'otp') handleOtpSubmit()
      else handleResetOtpSubmit()
    }
  }, [otpDigits, handleOtpSubmit, handleResetOtpSubmit, mode])

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0 || !onResendOtp) return
    try {
      await onResendOtp()
      startResendCooldown()
      toast.success('New code sent! Check your email.')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to resend code')
    }
  }, [resendCooldown, onResendOtp])

  // ── Reset password step handlers ───────────────────────────────────────────
  const handleForgotPasswordSubmit = useCallback(async () => {
    if (isLoading) return
    const e = resetEmail.trim()
    if (!e) { toast.error('Please enter your email address'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { toast.error('Please enter a valid email address'); return }
    if (!onForgotPassword) return
    try {
      await onForgotPassword(e)
      toast.success('If that email is registered, a reset code has been sent.')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    }
  }, [isLoading, resetEmail, onForgotPassword])

  const handleResetPasswordSubmit = useCallback(async () => {
    if (isLoading) return
    const p = newPassword.trim()
    const c = confirmPassword.trim()
    if (!p) { toast.error('Please enter a new password'); return }
    const strength = getPasswordStrength(p)
    if (!strength?.isStrong) { toast.error('Password is too weak. Please use a stronger password.'); return }
    if (p !== c) { toast.error('Passwords do not match'); return }
    if (!onResetPassword) return
    try {
      await onResetPassword(p)
      toast.success('Password reset! Please sign in with your new password.')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to reset password')
    }
  }, [isLoading, newPassword, confirmPassword, onResetPassword])

  // ── Early return — MUST come after all hooks ───────────────────────────────
  if (!open) return null

  const maskedEmail = otpEmail
    ? otpEmail.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => `${a}${'•'.repeat(Math.min(b.length, 6))}${c}`)
    : 'your email'

  // ── Step: Forgot Password (email entry) ────────────────────────────────────
  if (mode === 'forgot-password') {
    return (
      <div className={`auth-modal-root ${!canClose ? 'auth-modal-root--locked' : ''}`} role="dialog" aria-modal aria-labelledby="forgot-modal-title">
        <button type="button" className="auth-modal-backdrop" aria-label="Close" onClick={canClose ? onClose : undefined} />
        <div className="auth-modal-card auth-modal-card--gpt">
          {canClose && (
            <button type="button" className="auth-modal-close auth-modal-close--gpt icon-btn" aria-label="Close" onClick={onClose}>
              <X size={18} weight="bold" aria-hidden />
            </button>
          )}

          <div className="flex flex-col items-center text-center mb-6">
            <div className="size-14 rounded-2xl bg-pink-500/10 flex items-center justify-center mb-4">
              <EnvelopeSimple size={28} weight="duotone" className="text-pink-500" />
            </div>
            <h1 id="forgot-modal-title" className="auth-modal-title auth-modal-title--gpt mb-1">
              Forgot password?
            </h1>
            <p className="auth-modal-lede">
              Enter the email address linked to your account and we'll send you a reset code.
            </p>
          </div>

          <div className={`auth-modal-form ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
            <input
              type="email"
              placeholder="Email address"
              className="auth-modal-email"
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              disabled={isLoading}
              autoComplete="email"
              onKeyDown={e => { if (e.key === 'Enter') handleForgotPasswordSubmit() }}
              aria-label="Email address for password reset"
            />
            <button
              type="button"
              className="auth-modal-continue-main flex items-center justify-center gap-2"
              onClick={handleForgotPasswordSubmit}
              disabled={isLoading || !resetEmail.trim()}
            >
              {isLoading ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              Send reset code
            </button>
          </div>

          <button
            type="button"
            className="auth-modal-demo-text flex items-center justify-center gap-1.5 w-full mx-auto mt-2"
            onClick={() => switchMode('login')}
          >
            <ArrowLeft size={14} /> Back to sign in
          </button>
        </div>
      </div>
    )
  }

  // ── Step: Reset OTP (6-digit code entry) ──────────────────────────────────
  if (mode === 'reset-otp') {
    const code = otpDigits.join('')
    return (
      <div className={`auth-modal-root ${!canClose ? 'auth-modal-root--locked' : ''}`} role="dialog" aria-modal aria-labelledby="reset-otp-modal-title">
        <button type="button" className="auth-modal-backdrop" aria-label="Close" onClick={canClose ? onClose : undefined} />
        <div className="auth-modal-card auth-modal-card--gpt">
          {canClose && (
            <button type="button" className="auth-modal-close auth-modal-close--gpt icon-btn" aria-label="Close" onClick={onClose}>
              <X size={18} weight="bold" aria-hidden />
            </button>
          )}

          <div className="flex flex-col items-center text-center mb-6">
            <div className="size-14 rounded-2xl bg-pink-500/10 flex items-center justify-center mb-4">
              <EnvelopeSimple size={28} weight="duotone" className="text-pink-500 animate-pulse" />
            </div>
            <h1 id="reset-otp-modal-title" className="auth-modal-title auth-modal-title--gpt mb-1">
              Check your email
            </h1>
            <p className="auth-modal-lede">
              We sent a 6-digit reset code to <strong>{resetEmail || 'your email'}</strong>. Enter it below.
            </p>
          </div>

          <div className={`flex flex-col items-center gap-6 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="otp-container" role="group" aria-label="Reset verification code">
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  aria-label={`Digit ${i + 1}`}
                  className={`otp-digit-input ${digit ? 'has-value' : ''}`}
                />
              ))}
            </div>

            <button
              type="button"
              className="auth-modal-continue-main flex items-center justify-center gap-2 w-full active-squish"
              onClick={handleResetOtpSubmit}
              disabled={isLoading || code.length !== 6}
            >
              {isLoading ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              Verify code
            </button>

            <div className="flex flex-col items-center gap-1.5">
              <p className="text-xs text-[var(--mf-muted)]">Didn't receive the code?</p>
              <button
                type="button"
                onClick={async () => {
                  if (resendCooldown > 0) return
                  try {
                    if (onForgotPassword && resetEmail) {
                      await onForgotPassword(resetEmail)
                      startResendCooldown()
                      toast.success('New reset code sent!')
                    }
                  } catch {
                    toast.error('Failed to resend code')
                  }
                }}
                disabled={resendCooldown > 0 || isLoading}
                className={`text-xs font-semibold transition-colors ${
                  resendCooldown > 0
                    ? 'text-[var(--mf-muted)] cursor-not-allowed'
                    : 'text-pink-500 hover:text-pink-400 cursor-pointer'
                }`}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>

            <button
              type="button"
              className="auth-modal-demo-text flex items-center justify-center gap-1.5 w-full mx-auto"
              onClick={() => switchMode('forgot-password')}
            >
              <ArrowLeft size={14} /> Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Step: New Password ─────────────────────────────────────────────────────
  if (mode === 'reset-password') {
    const strengthResult = getPasswordStrength(newPassword)
    const isStrong = strengthResult?.isStrong ?? false
    const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0

    return (
      <div className={`auth-modal-root ${!canClose ? 'auth-modal-root--locked' : ''}`} role="dialog" aria-modal aria-labelledby="reset-password-modal-title">
        <button type="button" className="auth-modal-backdrop" aria-label="Close" onClick={canClose ? onClose : undefined} />
        <div className="auth-modal-card auth-modal-card--gpt">
          {canClose && (
            <button type="button" className="auth-modal-close auth-modal-close--gpt icon-btn" aria-label="Close" onClick={onClose}>
              <X size={18} weight="bold" aria-hidden />
            </button>
          )}

          <div className="flex flex-col items-center text-center mb-6">
            <div className="size-14 rounded-2xl bg-pink-500/10 flex items-center justify-center mb-4">
              <LockKey size={28} weight="duotone" className="text-pink-500" />
            </div>
            <h1 id="reset-password-modal-title" className="auth-modal-title auth-modal-title--gpt mb-1">
              Create new password
            </h1>
            <p className="auth-modal-lede">
              Choose a strong new password for your account.
            </p>
          </div>

          <div className={`auth-modal-form ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* New password */}
            <div className="password-input-wrapper">
              <input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="New password"
                className="auth-modal-email"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="new-password"
                aria-label="New password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowNewPassword(prev => !prev)}
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                disabled={isLoading}
              >
                {showNewPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Password strength meter */}
            {newPassword && (
              <div className="w-full mt-0 mb-1 px-1 space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                <div className="flex justify-between items-center text-[10.5px] font-medium tracking-wide">
                  <span className="text-muted-foreground uppercase">Password Strength</span>
                  {strengthResult && <span className={strengthResult.textClass}>{strengthResult.label}</span>}
                </div>
                <div className="h-1.5 w-full bg-muted/30 dark:bg-muted/10 rounded-full overflow-hidden flex gap-1">
                  {strengthResult && (
                    <>
                      <div className={`h-full rounded-full transition-all duration-500 flex-1 ${strengthResult.percent >= 33 ? strengthResult.label === 'Bad' ? 'bg-rose-500' : strengthResult.label === 'Good' ? 'bg-amber-500' : 'bg-emerald-500' : 'bg-transparent'}`} />
                      <div className={`h-full rounded-full transition-all duration-500 flex-1 ${strengthResult.percent >= 66 ? strengthResult.label === 'Good' ? 'bg-amber-500' : 'bg-emerald-500' : 'bg-muted/10'}`} />
                      <div className={`h-full rounded-full transition-all duration-500 flex-1 ${strengthResult.percent >= 100 ? 'bg-emerald-500' : 'bg-muted/10'}`} />
                    </>
                  )}
                </div>
                {strengthResult?.label === 'Bad' && (
                  <p className="text-[10px] text-muted-foreground leading-normal text-left flex items-center gap-2">
                    <WarningCircle size={14} aria-hidden className="text-rose-500" />
                    <span>Make it at least 8 characters with numbers or special symbols.</span>
                  </p>
                )}
                {strengthResult?.label === 'Good' && (
                  <p className="text-[10px] text-muted-foreground leading-normal text-left flex items-center gap-2">
                    <CheckCircle size={14} aria-hidden className="text-amber-500" />
                    <span>Good! Add uppercase letters and symbols for maximum security.</span>
                  </p>
                )}
                {strengthResult?.label === 'Excellent' && (
                  <p className="text-[10px] leading-normal font-medium text-emerald-500 dark:text-emerald-400 text-left flex items-center gap-2">
                    <Sparkle size={14} aria-hidden className="text-emerald-500" />
                    <span>Excellent! Your account will be highly secure.</span>
                  </p>
                )}
              </div>
            )}

            {/* Confirm password */}
            <input
              type="password"
              placeholder="Confirm new password"
              className="auth-modal-email"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="new-password"
              onKeyDown={e => { if (e.key === 'Enter') handleResetPasswordSubmit() }}
              aria-label="Confirm new password"
            />
            {confirmPassword && !passwordsMatch && (
              <p className="text-xs text-rose-500 text-left px-1 -mt-1 animate-in slide-in-from-top-1">
                Passwords don't match
              </p>
            )}

            <button
              type="button"
              className="auth-modal-continue-main flex items-center justify-center gap-2"
              onClick={handleResetPasswordSubmit}
              disabled={isLoading || !isStrong || !passwordsMatch}
            >
              {isLoading ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              Reset password
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Step: Login OTP ────────────────────────────────────────────────────────
  if (mode === 'otp') {
    const code = otpDigits.join('')
    return (
      <div className={`auth-modal-root ${!canClose ? 'auth-modal-root--locked' : ''}`} role="dialog" aria-modal aria-labelledby="otp-modal-title">
        <button type="button" className="auth-modal-backdrop" aria-label="Close" onClick={canClose ? onClose : undefined} />
        <div className="auth-modal-card auth-modal-card--gpt">
          {canClose && (
            <button type="button" className="auth-modal-close auth-modal-close--gpt icon-btn" aria-label="Close" onClick={onClose}>
              <X size={18} weight="bold" aria-hidden />
            </button>
          )}

          <div className="flex flex-col items-center text-center mb-6">
            <div className="size-14 rounded-2xl bg-pink-500/10 flex items-center justify-center mb-4 transition-all duration-300">
              <EnvelopeSimple size={28} weight="duotone" className="text-pink-500 animate-pulse" />
            </div>
            <h1 id="otp-modal-title" className="auth-modal-title auth-modal-title--gpt mb-1">
              Check your email
            </h1>
            <p className="auth-modal-lede">
              We sent a 6-digit code to <strong>{maskedEmail}</strong>. Enter it below to verify your identity.
            </p>
          </div>

          <div className={`flex flex-col items-center gap-6 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* 6 digit input boxes */}
            <div className="otp-container" role="group" aria-label="Verification code">
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  aria-label={`Digit ${i + 1}`}
                  className={`otp-digit-input ${digit ? 'has-value' : ''}`}
                />
              ))}
            </div>

            <button
              type="button"
              className="auth-modal-continue-main flex items-center justify-center gap-2 w-full active-squish"
              onClick={handleOtpSubmit}
              disabled={isLoading || code.length !== 6}
            >
              {isLoading
                ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : null}
              Verify code
            </button>

            <div className="flex flex-col items-center gap-1.5">
              <p className="text-xs text-[var(--mf-muted)]">Didn't receive the code?</p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || isLoading}
                className={`text-xs font-semibold transition-colors ${
                  resendCooldown > 0
                    ? 'text-[var(--mf-muted)] cursor-not-allowed'
                    : 'text-pink-500 hover:text-pink-400 cursor-pointer'
                }`}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>

            <button
              type="button"
              className="auth-modal-demo-text flex items-center justify-center gap-1.5 w-full mx-auto"
              onClick={() => switchMode('login')}
            >
              <ArrowLeft size={14} /> Back to sign in
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Credentials UI (login / register) ─────────────────────────────────────
  return (
    <div className={`auth-modal-root ${!canClose ? 'auth-modal-root--locked' : ''}`} role="dialog" aria-modal aria-labelledby="auth-modal-title">
      <button type="button" className="auth-modal-backdrop" aria-label="Close" onClick={canClose ? onClose : undefined} />
      <div className="auth-modal-card auth-modal-card--gpt">
        {canClose && (
          <button type="button" className="auth-modal-close auth-modal-close--gpt icon-btn" aria-label="Close" onClick={onClose}>
            <X size={18} weight="bold" aria-hidden />
          </button>
        )}

        {mode === 'login' ? (
          <>
            <h1 id="auth-modal-title" className="auth-modal-title auth-modal-title--gpt">
              Welcome back
            </h1>
            <p className="auth-modal-lede">
              Enter your email or username and password to sign in.
            </p>
          </>
        ) : preFillName ? (
          <>
            <h1 id="auth-modal-title" className="auth-modal-title auth-modal-title--gpt">
              One last step
            </h1>
            <p className="auth-modal-lede">
              Hi {preFillName}! Add login details to save your progress.
            </p>
          </>
        ) : (
          <>
            <h1 id="auth-modal-title" className="auth-modal-title auth-modal-title--gpt">
              Sign up
            </h1>
            <p className="auth-modal-lede">
              Enter your details to create your account.
            </p>
          </>
        )}

        <div className={`auth-modal-form ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
          {mode === 'register' && (
            <>
              {/* Only show name input if name wasn't already collected in onboarding */}
              {!preFillName && (
                <input
                  type="text"
                  placeholder="Your name"
                  className="auth-modal-email"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  disabled={isLoading}
                  autoComplete="name"
                />
              )}
              <input
                type="email"
                placeholder="Email address"
                className="auth-modal-email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
              />
            </>
          )}

          <input
            type="text"
            placeholder={mode === 'login' ? 'Email or username' : 'Username'}
            className="auth-modal-email"
            value={username}
            onChange={e => setUsername(e.target.value)}
            disabled={isLoading}
            autoComplete="username"
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
          />

          <div className="password-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              className="auth-modal-email"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(prev => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              disabled={isLoading}
            >
              {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {mode === 'register' && password && (
            <div className="w-full mt-2 mb-3 px-1 space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
              <div className="flex justify-between items-center text-[10.5px] font-medium tracking-wide">
                <span className="text-muted-foreground uppercase">Password Strength</span>
                {(() => {
                  const strength = getPasswordStrength(password)
                  if (!strength) return null
                  return <span className={strength.textClass}>{strength.label}</span>
                })()}
              </div>
              <div className="h-1.5 w-full bg-muted/30 dark:bg-muted/10 rounded-full overflow-hidden flex gap-1">
                {(() => {
                  const strength = getPasswordStrength(password)
                  if (!strength) return null
                  return (
                    <>
                      <div className={`h-full rounded-full transition-all duration-500 flex-1 ${strength.percent >= 33 ? strength.label === 'Bad' ? 'bg-rose-500' : strength.label === 'Good' ? 'bg-amber-500' : 'bg-emerald-500' : 'bg-transparent'}`} />
                      <div className={`h-full rounded-full transition-all duration-500 flex-1 ${strength.percent >= 66 ? strength.label === 'Good' ? 'bg-amber-500' : 'bg-emerald-500' : 'bg-muted/10'}`} />
                      <div className={`h-full rounded-full transition-all duration-500 flex-1 ${strength.percent >= 100 ? 'bg-emerald-500' : 'bg-muted/10'}`} />
                    </>
                  )
                })()}
              </div>
              {(() => {
                const strength = getPasswordStrength(password)
                if (strength?.label === 'Bad') {
                  return (
                    <p className="text-[10px] text-muted-foreground leading-normal text-left flex items-center gap-2">
                      <WarningCircle size={14} aria-hidden className="text-rose-500" />
                      <span>Make it at least 8 characters with numbers or special symbols.</span>
                    </p>
                  )
                }
                if (strength?.label === 'Good') {
                  return (
                    <p className="text-[10px] text-muted-foreground leading-normal text-left flex items-center gap-2">
                      <CheckCircle size={14} aria-hidden className="text-amber-500" />
                      <span>Good! Add uppercase letters and symbols for maximum security.</span>
                    </p>
                  )
                }
                return (
                  <p className="text-[10px] leading-normal font-medium text-emerald-500 dark:text-emerald-400 text-left flex items-center gap-2">
                    <Sparkle size={14} aria-hidden className="text-emerald-500" />
                    <span>Excellent! Your account is highly secure.</span>
                  </p>
                )
              })()}
            </div>
          )}

          <button
            type="button"
            className="auth-modal-continue-main flex items-center justify-center gap-2"
            onClick={handleSubmit}
            disabled={isLoading || !username.trim() || !password.trim()}
          >
            {isLoading ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
            {mode === 'login' ? 'Sign in' : preFillName ? 'Save progress' : 'Sign up'}
          </button>

          {/* Forgot password link — only shown on login step */}
          {mode === 'login' && onForgotPassword && (
            <button
              type="button"
              className="w-full text-center text-xs text-pink-500 hover:text-pink-400 font-medium transition-colors mt-1"
              onClick={() => switchMode('forgot-password')}
              disabled={isLoading}
            >
              Forgot password?
            </button>
          )}
        </div>

        <button
          type="button"
          className="auth-modal-demo-text"
          disabled={isLoading}
          onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}

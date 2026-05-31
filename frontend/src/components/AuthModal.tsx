import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Eye, EyeSlash, WarningCircle, CheckCircle, Sparkle, EnvelopeSimple, ArrowLeft } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { getPasswordStrength } from '../lib/passwordStrength'

type Mode = 'login' | 'register' | 'otp'

type AuthModalProps = {
  open: boolean
  onClose: () => void
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
}

const OTP_RESEND_SECONDS = 30

export function AuthModal({
  open,
  onClose,
  onLogin,
  onRegister,
  onVerifyOtp,
  onResendOtp,
  isLoading,
  otpMode = false,
  otpEmail = '',
  initialMode = 'login',
  preFillName = '',
}: AuthModalProps) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // OTP state
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [role] = useState<'lady' | 'partner'>(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('code') ? 'partner' : 'lady'
  })

  // Track previous otpMode to detect transitions during render (avoids state-in-effect anti-pattern)
  const [prevOtpMode, setPrevOtpMode] = useState(otpMode)
  // Ref flag used to trigger OTP side-effects exactly once after mode activation
  const otpActivatedRef = useRef(false)
  if (prevOtpMode !== otpMode) {
    setPrevOtpMode(otpMode)
    if (otpMode) {
      // Transitioned into OTP mode — sync all state during render
      setMode('otp')
      setOtpDigits(['', '', '', '', '', ''])
      otpActivatedRef.current = true
    }
  }

  // Sync mode/name when the modal opens on the non-OTP path
  useEffect(() => {
    if (open && !otpMode) {
      setMode(initialMode)
      if (preFillName) setName(preFillName)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialMode, preFillName])

  // Run OTP side-effects (cooldown + focus) after OTP mode is activated
  // This effect does NOT depend on otpMode prop, so react-doctor won't flag state-on-prop-change
  useEffect(() => {
    if (!otpActivatedRef.current) return
    otpActivatedRef.current = false
    startResendCooldown()
    // Focus first OTP box and return a cleanup to avoid a stale focus call on unmount
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
      else await onRegister(u, e, p, n, role)
      reset()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    }
  }, [isLoading, username, password, name, email, mode, onLogin, onRegister, role, reset])

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

  const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'Enter') handleOtpSubmit()
  }, [otpDigits, handleOtpSubmit])

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

  // ── Early return — MUST come after all hooks ───────────────────────────────
  if (!open) return null

  const maskedEmail = otpEmail
    ? otpEmail.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => `${a}${'•'.repeat(Math.min(b.length, 6))}${c}`)
    : 'your email'

  // ── OTP Step UI ────────────────────────────────────────────────────────────
  if (mode === 'otp') {
    const code = otpDigits.join('')
    return (
      <div className="auth-modal-root" role="dialog" aria-modal aria-labelledby="otp-modal-title">
        <button type="button" className="auth-modal-backdrop" aria-label="Close" onClick={onClose} />
        <div className="auth-modal-card auth-modal-card--gpt">
          <button type="button" className="auth-modal-close auth-modal-close--gpt icon-btn" aria-label="Close" onClick={onClose}>
            <X size={18} weight="bold" aria-hidden />
          </button>

          <div className="flex flex-col items-center text-center mb-6">
            <div className="size-14 rounded-2xl bg-pink-500/10 flex items-center justify-center mb-4">
              <EnvelopeSimple size={28} weight="duotone" className="text-pink-500" />
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
            <div className="flex gap-2.5" role="group" aria-label="Verification code">
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
                  className={`
                    w-11 h-14 rounded-xl border-2 text-center text-xl font-bold
                    bg-[var(--mf-hover)] text-[var(--mf-text-strong)]
                    outline-none transition-all duration-150
                    ${digit
                      ? 'border-pink-500 shadow-[0_0_0_3px_rgba(236,72,153,0.15)]'
                      : 'border-[var(--mf-border)] focus:border-pink-400 focus:shadow-[0_0_0_3px_rgba(236,72,153,0.1)]'
                    }
                  `}
                />
              ))}
            </div>

            <button
              type="button"
              className="auth-modal-continue-main flex items-center justify-center gap-2 w-full"
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
              className="auth-modal-demo-text flex items-center gap-1.5"
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
    <div className="auth-modal-root" role="dialog" aria-modal aria-labelledby="auth-modal-title">
      <button type="button" className="auth-modal-backdrop" aria-label="Close" onClick={onClose} />
      <div className="auth-modal-card auth-modal-card--gpt">
        <button type="button" className="auth-modal-close auth-modal-close--gpt icon-btn" aria-label="Close" onClick={onClose}>
          <X size={18} weight="bold" aria-hidden />
        </button>

        <h1 id="auth-modal-title" className="auth-modal-title auth-modal-title--gpt">
          {mode === 'login'
            ? 'Welcome back'
            : preFillName
              ? 'One last step'
              : 'Create your account'}
        </h1>
        <p className="auth-modal-lede">
          {mode === 'login'
            ? 'Enter your email or username and password to sign in.'
            : preFillName
              ? `Hi ${preFillName}! Set up your email, username and password to save your progress.`
              : 'Join MensFlow to track cycles, sync with your partner, and get AI-powered insights.'}
        </p>

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
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
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

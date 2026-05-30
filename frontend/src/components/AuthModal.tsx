import { useState } from 'react'
import { X, Eye, EyeSlash, WarningCircle, CheckCircle, Sparkle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { getPasswordStrength } from '../lib/passwordStrength'

type Mode = 'login' | 'register'

type AuthModalProps = {
  open: boolean
  onClose: () => void
  onLogin: (username: string, password: string) => Promise<void>
  onRegister: (username: string, password: string, name: string, role?: 'lady' | 'partner') => Promise<void>
  isLoading?: boolean
}

export function AuthModal({ open, onClose, onLogin, onRegister, isLoading }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role] = useState<'lady' | 'partner'>(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('code') ? 'partner' : 'lady'
  })

  if (!open) return null

  const reset = () => {
    setName('')
    setUsername('')
    setPassword('')
    setShowPassword(false)
  }

  const switchMode = (next: Mode) => {
    setMode(next)
    reset()
  }

  const handleSubmit = async () => {
    if (isLoading) return

    const u = username.trim()
    const p = password.trim()
    const n = name.trim()

    if (!u || !p) {
      toast.error('Please fill in all fields')
      return
    }

    if (mode === 'register') {
      if (!n) {
        toast.error('Please enter your name')
        return
      }
      const strength = getPasswordStrength(p)
      if (!strength || !strength.isStrong) {
        toast.error('Password is too weak. Please use a stronger password (at least Good).')
        return
      }
    }

    try {
      if (mode === 'login') {
        await onLogin(u, p)
      } else {
        await onRegister(u, p, n, role)
      }
      reset()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <div
      className="auth-modal-root"
      role="dialog"
      aria-modal
      aria-labelledby="auth-modal-title"
    >
      <button
        type="button"
        className="auth-modal-backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="auth-modal-card auth-modal-card--gpt">
        <button
          type="button"
          className="auth-modal-close auth-modal-close--gpt icon-btn"
          aria-label="Close"
          onClick={onClose}
        >
          <X size={18} weight="bold" aria-hidden />
        </button>

        <h1 id="auth-modal-title" className="auth-modal-title auth-modal-title--gpt">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="auth-modal-lede">
          {mode === 'login'
            ? 'Sign in to access your cycle data, partner sync, and chat history.'
            : 'Join MensFlow to track cycles, sync with your partner, and get AI-powered insights.'}
        </p>

        <div className={`auth-modal-form ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
          {mode === 'register' && (
            <>
              <input
                type="text"
                placeholder="Your name"
                className="auth-modal-email"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                autoComplete="name"
              />
            </>
          )}

          <input
            type="text"
            placeholder="Username"
            className="auth-modal-email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            autoComplete="username"
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
          />

          <div className="password-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              className="auth-modal-email"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword((prev) => !prev)}
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
                  return (
                    <span className={strength.textClass}>
                      {strength.label}
                    </span>
                  )
                })()}
              </div>
              <div className="h-1.5 w-full bg-muted/30 dark:bg-muted/10 rounded-full overflow-hidden flex gap-1">
                {(() => {
                  const strength = getPasswordStrength(password)
                  if (!strength) return null
                  return (
                    <>
                      <div className={`h-full rounded-full transition-all duration-500 flex-1 ${
                        strength.percent >= 33 
                          ? strength.label === 'Bad' 
                            ? 'bg-rose-500' 
                            : strength.label === 'Good' 
                              ? 'bg-amber-500' 
                              : 'bg-emerald-500'
                          : 'bg-transparent'
                      }`} />
                      <div className={`h-full rounded-full transition-all duration-500 flex-1 ${
                        strength.percent >= 66 
                          ? strength.label === 'Good' 
                            ? 'bg-amber-500' 
                            : 'bg-emerald-500'
                          : 'bg-muted/10'
                      }`} />
                      <div className={`h-full rounded-full transition-all duration-500 flex-1 ${
                        strength.percent >= 100 
                          ? 'bg-emerald-500' 
                          : 'bg-muted/10'
                      }`} />
                    </>
                  )
                })()}
              </div>
              {(() => {
                const strength = getPasswordStrength(password)
                if (strength?.label === 'Bad') {
                  return (
                    <p className="text-[10px] text-muted-foreground leading-normal text-left flex items-center gap-2">
                      <WarningCircle size={14} aria-hidden="true" className="text-rose-500" />
                      <span>Make it at least 8 characters with numbers or special symbols.</span>
                    </p>
                  )
                }
                if (strength?.label === 'Good') {
                  return (
                    <p className="text-[10px] text-muted-foreground leading-normal text-left flex items-center gap-2">
                      <CheckCircle size={14} aria-hidden="true" className="text-amber-500" />
                      <span>Good! Add uppercase letters and symbols for maximum security.</span>
                    </p>
                  )
                }
                return (
                  <p className="text-[10px] leading-normal font-medium text-emerald-500 dark:text-emerald-400 text-left flex items-center gap-2">
                    <Sparkle size={14} aria-hidden="true" className="text-emerald-500" />
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
            {isLoading ? (
              <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </div>

        <button
          type="button"
          className="auth-modal-demo-text"
          disabled={isLoading}
          onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login'
            ? "Don't have an account? Sign up"
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}

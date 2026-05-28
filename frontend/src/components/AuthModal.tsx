import { useState } from 'react'
import { X, Eye, EyeSlash } from '@phosphor-icons/react'
import { toast } from 'sonner'

type Mode = 'login' | 'register'

type AuthModalProps = {
  open: boolean
  onClose: () => void
  onLogin: (username: string, password: string) => Promise<void>
  onRegister: (username: string, password: string, name: string) => Promise<void>
  isLoading?: boolean
}

export function AuthModal({ open, onClose, onLogin, onRegister, isLoading }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

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

    if (mode === 'register' && !n) {
      toast.error('Please enter your name')
      return
    }

    try {
      if (mode === 'login') {
        await onLogin(u, p)
      } else {
        await onRegister(u, p, n)
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
            <input
              type="text"
              placeholder="Your name"
              className="auth-modal-email"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              autoComplete="name"
            />
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

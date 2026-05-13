import { useState } from 'react'
import {
  Phone,
  X,
} from '@phosphor-icons/react'

export type AuthMethod =
  | 'google'
  | 'apple'
  | 'phone'
  | 'email'
  | 'guest-demo'

type AuthModalProps = {
  open: boolean
  onClose: () => void
  onContinue: (method: AuthMethod) => void
  isLoading?: boolean
}

export function AuthModal({ open, onClose, onContinue, isLoading }: AuthModalProps) {
  const [email, setEmail] = useState('')

  if (!open) return null

  const submitEmail = () => {
    if (isLoading) return
    const trimmed = email.trim()
    if (!trimmed || !trimmed.includes('@')) return
    onContinue('email')
    setEmail('')
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
          Log in or sign up
        </h1>
        <p className="auth-modal-lede">
          You&apos;ll get smarter responses and can upload files, images, and more.
        </p>

        <div className={`auth-modal-methods auth-modal-methods--gpt ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
          <button
            type="button"
            className="auth-method-btn auth-method-btn--gpt"
            onClick={() => onContinue('google')}
            disabled={isLoading}
          >
            <img
              src="/images/google.png"
              className="auth-brand-icon auth-brand-icon--google"
              width={22}
              height={22}
              alt=""
              aria-hidden
            />
            Continue with Google
          </button>
          <button
            type="button"
            className="auth-method-btn auth-method-btn--gpt"
            onClick={() => onContinue('apple')}
            disabled={isLoading}
          >
            <img
              src="/images/apple.png"
              className="auth-brand-icon dark:invert"
              width={22}
              height={22}
              alt=""
              aria-hidden
            />
            Continue with Apple
          </button>
          <button
            type="button"
            className="auth-method-btn auth-method-btn--gpt"
            onClick={() => onContinue('phone')}
            disabled={isLoading}
          >
            <Phone className="auth-brand-icon" size={22} weight="duotone" aria-hidden />
            Continue with phone
          </button>
        </div>

        <div className="auth-modal-or" aria-hidden>
          <span className="auth-modal-or-line" />
          <span className="auth-modal-or-text">OR</span>
          <span className="auth-modal-or-line" />
        </div>

        <label className="auth-email-label visually-hidden" htmlFor="auth-email">
          Email address
        </label>
        <input
          id="auth-email"
          type="email"
          autoComplete="email"
          placeholder="Email address"
          className="auth-modal-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitEmail()
          }}
        />
        <button
          type="button"
          className="auth-modal-continue-main flex items-center justify-center gap-2"
          onClick={submitEmail}
          disabled={isLoading || !email.trim().includes('@')}
        >
          {isLoading ? (
             <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : null}
          Sign in
        </button>

        <button
          type="button"
          className="auth-modal-demo-text"
          disabled={isLoading}
          onClick={() => {
            onContinue('guest-demo')
            setEmail('')
          }}
        >
          Try MensFlow without signing in (demo)
        </button>
      </div>
    </div>
  )
}

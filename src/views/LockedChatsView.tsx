import { useState } from 'react'
import { useStore } from '../store/useStore'
import { Lock, LockKey, ShieldCheck } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { ChatView } from './ChatView'
import { SECURITY_QUESTIONS } from './SettingsView'
import { Info } from '@phosphor-icons/react'

export function LockedChatsView() {
  const { settings, updateSettings } = useStore()
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [mode, setMode] = useState<'unlock' | 'reset-security' | 'reset-password'>('unlock')
  const [securityAnswer, setSecurityAnswer] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const activeQuestion = SECURITY_QUESTIONS.find(q => q.id === settings.privacyLockChatsSecurityQuestion)

  const isStrong = newPassword.length >= 8 && 
    /[A-Z]/.test(newPassword) && 
    /[a-z]/.test(newPassword) && 
    /[0-9]/.test(newPassword) && 
    /[^A-Za-z0-9]/.test(newPassword);

  if (!settings.privacyLockChats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
        <div className="size-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-6">
          <ShieldCheck size={40} weight="duotone" />
        </div>
        <h2 className="text-xl font-semibold mb-2 text-foreground">Locked Chats Disabled</h2>
        <p className="text-muted-foreground max-w-md">
          You have disabled the locked chats feature. To use this feature, enable it in Settings under Security.
        </p>
      </div>
    )
  }

  if (!isUnlocked) {
    if (mode === 'reset-security') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
          <div className="size-20 rounded-full bg-[var(--mf-accent-soft)] flex items-center justify-center text-[var(--mf-accent)] mb-6 shadow-sm">
            <ShieldCheck size={40} weight="duotone" />
          </div>
          <h2 className="text-2xl font-medium tracking-tight mb-2 text-foreground">Security Question</h2>
          <p className="text-muted-foreground max-w-sm mb-8 text-sm">
            {activeQuestion ? activeQuestion.label : 'Answer your security question to reset your password.'}
          </p>
          
          <form 
            className="w-full max-w-xs space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (securityAnswer.trim().toLowerCase() === settings.privacyLockChatsSecurityAnswer) {
                setMode('reset-password')
                setError(false)
                setSecurityAnswer('')
              } else {
                setError(true)
              }
            }}
          >
            <div className="space-y-2 text-left">
              {activeQuestion?.type === 'select' ? (
                <select 
                  className={`w-full h-12 px-4 rounded-xl bg-muted border ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-border focus:border-[var(--mf-accent-border)] focus:ring-[var(--mf-accent)]'} focus:ring-1 transition-all outline-none text-base`}
                  value={securityAnswer}
                  onChange={(e) => {
                    setSecurityAnswer(e.target.value)
                    setError(false)
                  }}
                >
                  <option value="" disabled>Select an answer...</option>
                  {activeQuestion.options?.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input 
                  type="text" 
                  placeholder="Enter your answer"
                  value={securityAnswer}
                  onChange={(e) => {
                    setSecurityAnswer(e.target.value)
                    setError(false)
                  }}
                  className={`w-full h-12 px-4 rounded-xl bg-muted border ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-border focus:border-[var(--mf-accent-border)] focus:ring-[var(--mf-accent)]'} focus:ring-1 transition-all outline-none text-base`}
                  autoFocus
                />
              )}
            </div>
            {error && <p className="text-xs text-red-500 text-left px-1 animate-in slide-in-from-top-1">Incorrect answer. Please try again.</p>}
            <Button type="submit" disabled={!securityAnswer.trim()} className="w-full rounded-xl h-12 font-medium">
              Verify
            </Button>
            <Button type="button" variant="ghost" className="w-full rounded-xl text-sm" onClick={() => { setMode('unlock'); setError(false); }}>
              Cancel
            </Button>
          </form>
        </div>
      )
    }

    if (mode === 'reset-password') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
          <div className="size-20 rounded-full bg-[var(--mf-accent-soft)] flex items-center justify-center text-[var(--mf-accent)] mb-6 shadow-sm">
            <Lock size={40} weight="duotone" />
          </div>
          <h2 className="text-2xl font-medium tracking-tight mb-2 text-foreground">New Password</h2>
          <p className="text-muted-foreground max-w-sm mb-8 text-sm">
            Create a new password to protect your hidden conversations.
          </p>
          
          <form 
            className="w-full max-w-xs space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (isStrong) {
                updateSettings({ privacyLockChatsPassword: newPassword })
                setIsUnlocked(true)
                setMode('unlock')
                setPassword('')
                setNewPassword('')
                setFailedAttempts(0)
              }
            }}
          >
            <div className="relative text-left">
              <LockKey size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="password" 
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-12 pl-10 pr-4 rounded-xl bg-muted border border-border focus:border-[var(--mf-accent-border)] focus:ring-[var(--mf-accent)] focus:ring-1 transition-all outline-none text-base"
                autoFocus
              />
              <div className={`flex gap-2 items-start text-xs p-3 rounded-lg border mt-3 transition-colors ${
                newPassword.length > 0 && !isStrong 
                  ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:border-red-900/50' 
                  : 'text-muted-foreground bg-[var(--mf-accent-soft)]/30 border-[var(--mf-accent)]/20'
              }`}>
                <Info size={16} className={`shrink-0 mt-0.5 ${newPassword.length > 0 && !isStrong ? 'text-red-500' : 'text-[var(--mf-accent)]'}`} />
                <p>
                  <strong>Tip for a strong password:</strong> Use at least 8 characters, combining uppercase and lowercase letters, numbers, and symbols.
                  {newPassword.length > 0 && !isStrong && <span className="block mt-1 font-medium">Your password is too weak and cannot be used.</span>}
                </p>
              </div>
            </div>
            <Button type="submit" disabled={!isStrong} className="w-full rounded-xl h-12 font-medium">
              Update & Unlock
            </Button>
          </form>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
        <div className="size-20 rounded-full bg-[var(--mf-accent-soft)] flex items-center justify-center text-[var(--mf-accent)] mb-6 shadow-sm">
          <Lock size={40} weight="duotone" />
        </div>
        <h2 className="text-2xl font-medium tracking-tight mb-2 text-foreground">Locked Chats</h2>
        <p className="text-muted-foreground max-w-sm mb-8 text-sm">
          Enter your privacy password to access your hidden conversations.
        </p>
        
        <form 
          className="w-full max-w-xs space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (password === settings.privacyLockChatsPassword) {
              setIsUnlocked(true)
              setError(false)
              setFailedAttempts(0)
            } else {
              setError(true)
              setFailedAttempts(f => f + 1)
            }
          }}
        >
          <div className="relative">
            <LockKey size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="password" 
              placeholder="Enter password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError(false)
              }}
              className={`w-full h-12 pl-10 pr-4 rounded-xl bg-muted border ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-border focus:border-[var(--mf-accent-border)] focus:ring-[var(--mf-accent)]'} focus:ring-1 transition-all outline-none text-base`}
              autoFocus
            />
          </div>
          {error && <p className="text-xs text-red-500 text-left px-1 animate-in slide-in-from-top-1">Incorrect password. Please try again.</p>}
          <Button type="submit" className="w-full rounded-xl h-12 font-medium">
            Unlock
          </Button>
          {failedAttempts >= 3 && settings.privacyLockChatsSecurityQuestion && (
            <div className="pt-2 animate-in fade-in duration-500">
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full text-sm text-[var(--mf-accent)] hover:bg-[var(--mf-accent-soft)]"
                onClick={() => {
                  setMode('reset-security')
                  setError(false)
                  setSecurityAnswer('')
                }}
              >
                Forgot Password?
              </Button>
            </div>
          )}
        </form>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between p-6 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-[var(--mf-accent-soft)] flex items-center justify-center text-[var(--mf-accent)]">
            <Lock size={20} weight="fill" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight text-foreground">Locked Chats</h1>
            <p className="text-xs text-muted-foreground">End-to-end encrypted locally</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="rounded-lg h-9 text-xs font-medium"
          onClick={() => {
            setIsUnlocked(false)
            setPassword('')
          }}
        >
          Lock Now
        </Button>
      </div>
      
      <div className="flex-1 flex flex-col relative overflow-hidden bg-background">
        <ChatView storageKey="mensflow_locked_chats" />
      </div>
    </div>
  )
}

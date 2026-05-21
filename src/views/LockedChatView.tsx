import { useState } from 'react'
import { LockKey, ShieldCheck } from '@phosphor-icons/react'
import { useSettings } from '../context/useSettings'
import { ChatView } from './ChatView'
import { LOCKED_CHAT_STORAGE_KEY, CLEAR_LOCKED_CHATS_EVENT } from '../lib/constants'
import { Button } from '@/components/ui/button'

export function LockedChatView() {
  const { settings } = useSettings()
  const [unlocked, setUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (!settings.chatLockPassword) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <LockKey size={48} weight="duotone" className="text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-xl font-medium mb-2">Locked Chats Not Activated</h2>
        <p className="text-muted-foreground">
          You can enable Locked Chats in your Settings under Security.
        </p>
      </div>
    )
  }

  if (!unlocked) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-background">
        <div className="max-w-sm w-full space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="size-20 rounded-full bg-[var(--mf-accent-soft)] flex items-center justify-center text-[var(--mf-accent)] mb-2">
              <ShieldCheck size={40} weight="duotone" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Locked Chats</h1>
            <p className="text-muted-foreground text-sm">
              Enter your password to view hidden conversations.
            </p>
          </div>

          <form 
            onSubmit={(e) => {
              e.preventDefault()
              if (password === settings.chatLockPassword) {
                setUnlocked(true)
                setError('')
              } else {
                setError('Incorrect password')
                setPassword('')
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                className={`w-full h-12 px-4 rounded-xl bg-muted border ${error ? 'border-red-500' : 'border-border focus:border-[var(--mf-accent-border)]'} focus:ring-1 focus:ring-[var(--mf-accent)] transition-all outline-none text-base`}
                autoFocus
              />
              {error && <p className="text-red-500 text-sm font-medium ml-1">{error}</p>}
            </div>
            <Button type="submit" className="w-full rounded-xl h-12 text-base font-medium">
              Unlock
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <ChatView 
      storageKey={LOCKED_CHAT_STORAGE_KEY} 
      clearEventName={CLEAR_LOCKED_CHATS_EVENT} 
    />
  )
}

import React from 'react'
import { SidebarSimple, Lock, LockOpen } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

interface ChatHeaderProps {
  title: string
  sidebarOpen: boolean
  onToggleSidebar: () => void
  hasActiveSession: boolean
  isLocked: boolean
  isLocking: boolean
  onLock: (e: React.MouseEvent) => void
  onUnlock: () => void
}

export function ChatHeader({
  title,
  sidebarOpen,
  onToggleSidebar,
  hasActiveSession,
  isLocked,
  isLocking,
  onLock,
  onUnlock,
}: ChatHeaderProps) {
  return (
    <div className="chat-header-bar">
      <div className="chat-header-left">
        <button
          type="button"
          className="chat-toggle-sidebar-btn active-squish"
          onClick={onToggleSidebar}
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <SidebarSimple size={20} />
        </button>
        <span className="chat-header-title">{title}</span>
      </div>

      <div className="flex items-center gap-2">
        {hasActiveSession && !isLocked && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg h-8 text-xs gap-1.5"
            onClick={onLock}
            disabled={isLocking}
          >
            <Lock size={14} />
            {isLocking ? 'Locking…' : 'Lock Chat'}
          </Button>
        )}
        {hasActiveSession && isLocked && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
              <Lock size={10} weight="fill" />
              Locked
            </span>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg h-8 text-xs gap-1.5 hover:text-emerald-500 hover:border-emerald-500/30"
              title="Remove password protection and make this chat public"
              onClick={onUnlock}
            >
              <LockOpen size={14} />
              Unlock
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

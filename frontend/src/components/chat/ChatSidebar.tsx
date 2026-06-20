import { X, Plus, ChatCircle, Lock, Trash } from '@phosphor-icons/react'
import { cn } from '../../lib/utils'
import type { ApiChatSession } from '../../services/chatService'

interface Props {
  sessions: ApiChatSession[]
  activeSessionId: string | null
  isOpen: boolean
  showOnlyLocked: boolean
  onSessionClick: (sessionId: string) => void
  onNewChat: () => void
  onClose: () => void
  onLock: (sessionId: string, e: React.MouseEvent) => void
  onDelete: (sessionId: string, e: React.MouseEvent) => void
}

export function ChatSidebar({
  sessions,
  activeSessionId,
  isOpen,
  showOnlyLocked,
  onSessionClick,
  onNewChat,
  onClose,
  onLock,
  onDelete,
}: Props) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 md:hidden"
          onClick={onClose}
        />
      )}
      <aside className={cn("chat-sidebar-wrapper", !isOpen && "collapsed")}>
        {!showOnlyLocked && (
          <div className="chat-sidebar-header flex items-center justify-between gap-2">
            <button
              type="button"
              className="chat-new-btn active-squish flex-1"
              onClick={onNewChat}
            >
              <Plus size={16} weight="bold" />
              <span>New Chat</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-xl transition-all"
              title="Close Menu"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
        )}

        <div className="chat-sessions-list scrollbar-hide">
          <div className="text-[10px] text-muted-foreground uppercase font-semibold px-2 mb-2 tracking-wider">
            Recent Chats
          </div>
          {sessions.length === 0 ? (
            <div className="text-xs text-muted-foreground px-2 py-4 italic">
              No recent chats
            </div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.sessionId}
                className={cn(
                  "chat-session-item",
                  activeSessionId === s.sessionId && "active"
                )}
                onClick={() => onSessionClick(s.sessionId)}
              >
                <div className="chat-session-left">
                  {s.isLocked ? (
                    <Lock size={16} className="text-amber-500 shrink-0" />
                  ) : (
                    <ChatCircle size={16} className="opacity-70 shrink-0" />
                  )}
                  <span className="chat-session-title">
                    {s.title}
                  </span>
                </div>

                <div className="chat-session-actions">
                  {!s.isLocked && (
                    <button
                      type="button"
                      className="chat-session-action-btn"
                      title="Lock Chat"
                      onClick={(e) => onLock(s.sessionId, e)}
                    >
                      <Lock size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="chat-session-action-btn"
                    title="Delete Chat"
                    onClick={(e) => onDelete(s.sessionId, e)}
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  )
}

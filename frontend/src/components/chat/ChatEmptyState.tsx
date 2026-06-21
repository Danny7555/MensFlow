import { Lock } from '@phosphor-icons/react'

export function ChatEmptyState() {
  return (
    <div className="flex-1 overflow-y-auto flex items-center justify-center p-4">
      <div className="text-center max-w-sm mx-auto space-y-4">
        <div className="size-16 rounded-full bg-[var(--mf-accent-soft)]/20 flex items-center justify-center text-[var(--mf-accent)] mx-auto animate-pulse">
          <Lock size={32} />
        </div>
        <h2 className="text-lg font-semibold text-[var(--mf-text-strong)]">No Locked Chats</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          You haven&apos;t locked any conversation sessions yet. Go to the main chat, select a conversation, and click the &quot;Lock Chat&quot; button to secure it.
        </p>
      </div>
    </div>
  )
}

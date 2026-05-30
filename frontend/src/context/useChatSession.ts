import { use } from 'react'
import { ChatSessionContext } from './chat-session-context'

export function useChatSession() {
  const ctx = use(ChatSessionContext)
  if (!ctx)
    throw new Error('useChatSession must be used within ChatSessionContext.Provider')
  return ctx
}

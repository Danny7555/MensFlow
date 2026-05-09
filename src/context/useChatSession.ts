import { useContext } from 'react'
import { ChatSessionContext } from './chat-session-context'

export function useChatSession() {
  const ctx = useContext(ChatSessionContext)
  if (!ctx)
    throw new Error('useChatSession must be used within ChatSessionContext.Provider')
  return ctx
}

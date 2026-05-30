import { createContext } from 'react'

export type ChatSessionContextValue = {
  /** When true, assistant chats are not persisted and are treated as ephemeral */
  temporaryChat: boolean
  setTemporaryChat: (value: boolean) => void
}

export const ChatSessionContext =
  createContext<ChatSessionContextValue | null>(null)

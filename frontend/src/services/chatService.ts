import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, post, put, del } from '../lib/apiClient'
import { isLoggedIn } from '../lib/auth-token'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ApiChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: number
}

export type ApiChatSession = {
  sessionId: string
  isLocked: boolean
  securityQuestion: string | null
  createdAt: number
  messageCount: number
  title: string
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

export const chatApi = {
  getSessions: () =>
    get<ApiChatSession[]>('/chat/sessions'),

  getMessages: (sessionId: string, passcode?: string) =>
    get<ApiChatMessage[]>(
      `/chat/sessions/${encodeURIComponent(sessionId)}${passcode ? `?passcode=${encodeURIComponent(passcode)}` : ''}`
    ),

  send: (sessionId: string, text: string, passcode?: string) =>
    post<{ userMessage: ApiChatMessage; assistantMessage: ApiChatMessage }>(
      '/chat/message',
      { sessionId, text, ...(passcode ? { passcode } : {}) }
    ),

  lock: (sessionId: string, passcode: string, securityQuestion: string, securityAnswer: string) =>
    put<{ success: boolean }>(`/chat/sessions/${encodeURIComponent(sessionId)}/lock`, {
      passcode,
      securityQuestion,
      securityAnswer,
    }),

  unlock: (sessionId: string, passcode?: string, securityAnswer?: string) =>
    post<{ success: boolean; passcode?: string }>(`/chat/sessions/${encodeURIComponent(sessionId)}/unlock`, {
      ...(passcode ? { passcode } : {}),
      ...(securityAnswer ? { securityAnswer } : {}),
    }),

  deleteSession: (sessionId: string) =>
    del<{ success: boolean }>(`/chat/sessions/${encodeURIComponent(sessionId)}`),

  getSuggestions: () =>
    get<string[]>('/chat/suggestions'),
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export const chatKeys = {
  sessions: ['chatSessions'] as const,
  messages: (sessionId: string) => ['chatMessages', sessionId] as const,
  suggestions: ['chatSuggestions'] as const,
}

export function useChatSuggestions() {
  return useQuery({
    queryKey: chatKeys.suggestions,
    queryFn: () => chatApi.getSuggestions(),
  })
}

export function useChatSessions() {
  return useQuery({
    queryKey: chatKeys.sessions,
    queryFn: () => chatApi.getSessions(),
    enabled: isLoggedIn(),
  })
}

export function useChatMessages(sessionId: string | null, passcode?: string) {
  return useQuery({
    queryKey: chatKeys.messages(sessionId ?? ''),
    queryFn: () => chatApi.getMessages(sessionId!, passcode),
    enabled: isLoggedIn() && !!sessionId,
  })
}

export function useSendChatMessageMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, text, passcode }: { sessionId: string; text: string; passcode?: string }) =>
      chatApi.send(sessionId, text, passcode),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(variables.sessionId) })
      queryClient.invalidateQueries({ queryKey: chatKeys.sessions })
    },
  })
}

export function useLockChatSessionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      sessionId,
      passcode,
      securityQuestion,
      securityAnswer,
    }: {
      sessionId: string
      passcode: string
      securityQuestion: string
      securityAnswer: string
    }) => chatApi.lock(sessionId, passcode, securityQuestion, securityAnswer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.sessions })
    },
  })
}

export function useUnlockChatSessionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      sessionId,
      passcode,
      securityAnswer,
    }: {
      sessionId: string
      passcode?: string
      securityAnswer?: string
    }) => chatApi.unlock(sessionId, passcode, securityAnswer),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.sessions })
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(variables.sessionId) })
    },
  })
}

export function useDeleteChatSessionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => chatApi.deleteSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.sessions })
    },
  })
}

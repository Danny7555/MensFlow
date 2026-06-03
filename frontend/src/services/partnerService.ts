import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, post } from '../lib/apiClient'
import { isLoggedIn } from '../lib/auth-token'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ApiPartnerStatus = {
  paired: boolean
  privacyShareCycleDetails?: boolean
  partner?: {
    name: string
    avatar: string | null
    accessLevel: 'full' | 'educational'
  }
  cycle?: {
    lastPeriodStart: string
    typicalCycleDays: number
    phaseLabel: string
    hormoneTrend: string
    bodySignals: string
    symptoms?: string[]
    water?: number
    weight?: number
    bbt?: number | null
    mucus?: string | null
    cycleVariationDays?: number
    isAtypical?: boolean
    scientificInsight?: string
    dailyTip?: {
      title: string
      desc: string
    }
  } | null
  support?: {
    completedActions: string[]
    supportStreak: number
    lastActionDate: string
  }
}

export type ApiPing = {
  pingId: string
  label: string
  message: string
  timestamp: number
  senderId?: string
}

export type ApiPartnerMessage = {
  id: string
  senderId: string
  receiverId: string
  text: string
  createdAt: number
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

export const partnerApi = {
  getStatus: () =>
    get<ApiPartnerStatus>('/partner/status'),

  pair: (partnerCode: string) =>
    post<{ success: boolean; partner: { id: string; name: string } }>('/partner/pair', { partnerCode }),

  invite: (email: string) =>
    post<{ success: boolean; partnerFound: boolean; id?: string; name?: string }>('/partner/invite', { email }),

  disconnect: () =>
    post<{ success: boolean }>('/partner/disconnect', {}),

  requestAccess: () =>
    post<{ success: boolean; alreadyPending: boolean; emailQueued: boolean }>('/partner/request-access', {}),

  sendPing: (pingId: string, label: string, message: string) =>
    post<{ success: boolean; ping: ApiPing }>('/partner/ping', { pingId, label, message }),

  getLatestPing: () =>
    get<ApiPing | null>('/partner/ping'),

  toggleAction: (actionId: string) =>
    post<{ completedActions: string[]; supportStreak: number; lastActionDate: string }>(
      '/partner/action',
      { actionId }
    ),

  getChatMessages: () =>
    get<ApiPartnerMessage[]>('/partner/chat'),

  sendChatMessage: (text: string) =>
    post<{ success: boolean; message: ApiPartnerMessage }>('/partner/chat', { text }),

  getSuggestedReplies: () =>
    get<string[]>('/partner/chat/suggest-replies'),
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

const partnerKeys = {
  chat: ['partnerChat'] as const,
  suggestions: ['partnerChatSuggestions'] as const,
}

export function usePartnerChatMessagesQuery(options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: partnerKeys.chat,
    queryFn: () => partnerApi.getChatMessages(),
    enabled: isLoggedIn(),
    ...options,
  })
}

export function useSendPartnerChatMessageMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (text: string) => partnerApi.sendChatMessage(text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.chat })
    },
  })
}

export function usePartnerChatSuggestionsQuery() {
  return useQuery({
    queryKey: partnerKeys.suggestions,
    queryFn: () => partnerApi.getSuggestedReplies(),
    enabled: isLoggedIn(),
    staleTime: 5000,
  })
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, post } from '../lib/apiClient'
import { userKeys } from './userService'
import { isLoggedIn } from '../lib/auth-token'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ApiPartnerStatus = {
  paired: boolean
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

  sendPing: (pingId: string, label: string, message: string) =>
    post<{ success: boolean; ping: ApiPing }>('/partner/ping', { pingId, label, message }),

  getLatestPing: () =>
    get<ApiPing | null>('/partner/ping'),

  toggleAction: (actionId: string) =>
    post<{ completedActions: string[]; supportStreak: number; lastActionDate: string }>(
      '/partner/action',
      { actionId }
    ),
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export const partnerKeys = {
  status: ['partnerStatus'] as const,
  ping: ['latestPing'] as const,
}

export function usePartnerStatus() {
  return useQuery({
    queryKey: partnerKeys.status,
    queryFn: () => partnerApi.getStatus(),
    enabled: isLoggedIn(),
  })
}

export function usePairPartnerMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (partnerCode: string) => partnerApi.pair(partnerCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.status })
      queryClient.invalidateQueries({ queryKey: userKeys.profile })
    },
  })
}

export function useDisconnectPartnerMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => partnerApi.disconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.status })
      queryClient.invalidateQueries({ queryKey: userKeys.profile })
    },
  })
}

export function useSendPingMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ pingId, label, message }: { pingId: string; label: string; message: string }) =>
      partnerApi.sendPing(pingId, label, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.ping })
    },
  })
}

export function useLatestPingQuery(options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: partnerKeys.ping,
    queryFn: () => partnerApi.getLatestPing(),
    enabled: isLoggedIn(),
    ...options,
  })
}

export function useToggleSupportActionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (actionId: string) => partnerApi.toggleAction(actionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.status })
    },
  })
}

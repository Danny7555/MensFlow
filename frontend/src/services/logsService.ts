import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, post, del } from '../lib/apiClient'
import { isLoggedIn } from '../lib/auth-token'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ApiSymptomLog = {
  date: string
  symptoms: string[]
  water?: number
  weight?: number
}

export type ApiCustomSymptom = {
  id: string
  label: string
  category: string
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

export const logsApi = {
  getAll: () =>
    get<ApiSymptomLog[]>('/logs'),

  upsert: (date: string, symptoms?: string[], water?: number, weight?: number) =>
    post<ApiSymptomLog>('/logs', { date, symptoms, water, weight }),

  clearAll: () =>
    del<{ success: boolean }>('/logs'),

  getCustom: () =>
    get<ApiCustomSymptom[]>('/logs/custom'),

  addCustom: (label: string, category: string) =>
    post<ApiCustomSymptom>('/logs/custom', { label, category }),

  removeCustom: (id: string) =>
    del<{ success: boolean }>(`/logs/custom/${id}`),
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export const logsKeys = {
  all: ['cycleLogs'] as const,
  custom: ['customSymptoms'] as const,
}

export function useCycleLogs() {
  return useQuery({
    queryKey: logsKeys.all,
    queryFn: () => logsApi.getAll(),
    enabled: isLoggedIn(),
  })
}

export function useUpsertLogMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ date, symptoms }: { date: string; symptoms: string[] }) =>
      logsApi.upsert(date, symptoms),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: logsKeys.all })
    },
  })
}

export function useClearLogsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => logsApi.clearAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: logsKeys.all })
    },
  })
}

export function useCustomSymptoms() {
  return useQuery({
    queryKey: logsKeys.custom,
    queryFn: () => logsApi.getCustom(),
    enabled: isLoggedIn(),
  })
}

export function useAddCustomSymptomMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ label, category }: { label: string; category: string }) =>
      logsApi.addCustom(label, category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: logsKeys.custom })
    },
  })
}

export function useRemoveCustomSymptomMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => logsApi.removeCustom(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: logsKeys.custom })
    },
  })
}

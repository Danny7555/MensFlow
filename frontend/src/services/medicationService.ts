import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, post, put, del } from '../lib/apiClient'
import { isLoggedIn } from '../lib/auth-token'

export type ApiMedication = {
  _id: string
  name: string
  dosage: string
  frequency: 'daily' | 'weekly' | 'as-needed'
  timeOfDay: string
  notes: string
  active: boolean
  createdAt: string
}

export const medicationApi = {
  list: () => get<ApiMedication[]>('/medications'),
  create: (data: { name: string; dosage?: string; frequency?: string; timeOfDay?: string; notes?: string }) =>
    post<ApiMedication>('/medications', data),
  update: (id: string, data: Partial<ApiMedication>) =>
    put<ApiMedication>(`/medications/${id}`, data),
  delete: (id: string) => del<{ success: boolean }>(`/medications/${id}`),
}

export function useMedications() {
  return useQuery({
    queryKey: ['medications'],
    queryFn: () => medicationApi.list(),
    enabled: isLoggedIn(),
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreateMedication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; dosage?: string; frequency?: string; timeOfDay?: string; notes?: string }) =>
      medicationApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medications'] }),
  })
}

export function useDeleteMedication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => medicationApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medications'] }),
  })
}

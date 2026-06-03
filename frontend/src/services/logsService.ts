import { get, post, del } from '../lib/apiClient'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ApiSymptomLog = {
  date: string
  symptoms: string[]
  water?: number
  weight?: number
  lhLevel?: string | null
  mucus?: string | null
}

export type ApiCustomSymptom = {
  id: string
  label: string
  category: string
}

export type ApiMonthInReview = {
  cycleLength: number
  periodLength: number
  energyPeakStart: number
  energyPeakEnd: number
  crampingChange: number
  partnerActions: number
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

export const logsApi = {
  getAll: () =>
    get<ApiSymptomLog[]>('/logs'),

  getMonthInReview: () =>
    get<ApiMonthInReview>('/logs/review'),

  upsert: (date: string, symptoms?: string[], water?: number, weight?: number, lhLevel?: string | null, mucus?: string | null) =>
    post<ApiSymptomLog>('/logs', { date, symptoms, water, weight, lhLevel, mucus }),

  clearAll: () =>
    del<{ success: boolean }>('/logs'),

  getCustom: () =>
    get<ApiCustomSymptom[]>('/logs/custom'),

  addCustom: (label: string, category: string) =>
    post<ApiCustomSymptom>('/logs/custom', { label, category }),

  removeCustom: (id: string) =>
    del<{ success: boolean }>(`/logs/custom/${id}`),
}

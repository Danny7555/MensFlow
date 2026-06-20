import type { StateCreator } from 'zustand'
import type { AppState, LogsSlice } from '../types'
import type { SymptomCategory } from '../../data/symptomsData'
import { isLoggedIn } from '../../lib/auth-token'
import { logsApi } from '../../services/logsService'
import { userApi, userKeys } from '../../services/userService'
import { queryClient } from '../../lib/queryClient'
import { toast } from 'sonner'

export const createLogsSlice: StateCreator<AppState, [], [], LogsSlice> = (set, get) => ({
  logs: [],
  monthInReview: null,
  loginHistory: [],
  customSymptoms: [],

  fetchLogs: async () => {
    if (isLoggedIn()) {
      const logs = await logsApi.getAll()
      set({ logs })
    }
  },

  fetchMonthInReview: async () => {
    if (isLoggedIn()) {
      try {
        const data = await logsApi.getMonthInReview()
        set({ monthInReview: data })
      } catch (err) {
        console.error('Failed to fetch month in review:', err)
      }
    }
  },

  fetchLoginHistory: async () => {
    if (isLoggedIn()) {
      try {
        const data = await userApi.getLoginHistory()
        set({ loginHistory: data })
      } catch (err) {
        console.error('Failed to fetch login history:', err)
      }
    }
  },

  addLog: async (date, symptoms, lhLevel, mucus) => {
    set({ isSaving: true })
    try {
      const existing = get().logs.find((l) => l.date === date)
      const targetWater = existing?.water
      const targetWeight = existing?.weight
      const targetLhLevel = lhLevel !== undefined ? lhLevel : existing?.lhLevel
      const targetMucus = mucus !== undefined ? mucus : existing?.mucus
      const isLocalOnly = get().settings.privacyStrictLocalOnly

      if (isLoggedIn() && !isLocalOnly) {
        const previousLogs = get().logs
        set((state) => ({
          logs: [
            ...state.logs.filter((l) => l.date !== date),
            { date, symptoms, water: targetWater ?? 1000, weight: targetWeight ?? 62.5, lhLevel: targetLhLevel ?? null, mucus: targetMucus ?? null },
          ],
        }))
        try {
          const log = await logsApi.upsert(date, symptoms, targetWater, targetWeight, targetLhLevel, targetMucus)
          set((state) => ({
            logs: [
              ...state.logs.filter((l) => l.date !== date),
              { date: log.date, symptoms: log.symptoms, water: log.water, weight: log.weight, lhLevel: log.lhLevel, mucus: log.mucus },
            ],
          }))
          queryClient.invalidateQueries({ queryKey: ['symptomLogs'] })
          queryClient.invalidateQueries({ queryKey: ['monthInReview'] })
          queryClient.invalidateQueries({ queryKey: userKeys.profile })
        } catch (err) {
          set({ logs: previousLogs })
          throw err
        }
      } else {
        set((state) => ({
          logs: [
            ...state.logs.filter((l) => l.date !== date),
            { date, symptoms, water: targetWater ?? 1000, weight: targetWeight ?? 62.5, lhLevel: targetLhLevel ?? null, mucus: targetMucus ?? null },
          ],
        }))
      }
      return true
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save log')
      return false
    } finally {
      set({ isSaving: false })
    }
  },

  updateDailyMetrics: async (date, water, weight, lhLevel, mucus) => {
    set({ isSaving: true })
    try {
      const existing = get().logs.find((l) => l.date === date)
      const existingSymptoms = existing?.symptoms ?? []
      const existingWater = existing?.water ?? 1000
      const existingWeight = existing?.weight ?? 62.5
      const existingLhLevel = existing?.lhLevel ?? null
      const existingMucus = existing?.mucus ?? null
      const targetWater = water !== undefined ? water : existingWater
      const targetWeight = weight !== undefined ? weight : existingWeight
      const targetLhLevel = lhLevel !== undefined ? lhLevel : existingLhLevel
      const targetMucus = mucus !== undefined ? mucus : existingMucus
      const isLocalOnly = get().settings.privacyStrictLocalOnly

      if (isLoggedIn() && !isLocalOnly) {
        const log = await logsApi.upsert(date, undefined, targetWater, targetWeight, targetLhLevel, targetMucus)
        set((state) => ({
          logs: [
            ...state.logs.filter((l) => l.date !== date),
            { date: log.date, symptoms: log.symptoms, water: log.water, weight: log.weight, lhLevel: log.lhLevel, mucus: log.mucus },
          ],
        }))
        queryClient.invalidateQueries({ queryKey: ['symptomLogs'] })
        queryClient.invalidateQueries({ queryKey: ['monthInReview'] })
        queryClient.invalidateQueries({ queryKey: userKeys.profile })
      } else {
        set((state) => ({
          logs: [
            ...state.logs.filter((l) => l.date !== date),
            { date, symptoms: existingSymptoms, water: targetWater, weight: targetWeight, lhLevel: targetLhLevel, mucus: targetMucus },
          ],
        }))
      }
      return true
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update daily metrics')
      return false
    } finally {
      set({ isSaving: false })
    }
  },

  getLogForDate: (date) => get().logs.find((l) => l.date === date),

  clearLogs: async () => {
    if (isLoggedIn()) {
      await logsApi.clearAll()
      queryClient.invalidateQueries({ queryKey: ['symptomLogs'] })
      queryClient.invalidateQueries({ queryKey: ['monthInReview'] })
      queryClient.invalidateQueries({ queryKey: userKeys.profile })
    }
    set({ logs: [] })
  },

  fetchCustomSymptoms: async () => {
    if (isLoggedIn()) {
      const items = await logsApi.getCustom()
      set({
        customSymptoms: items.map((c) => ({
          id: c.id,
          label: c.label,
          category: c.category as SymptomCategory,
        })),
      })
    }
  },

  addCustomSymptom: async (label, category) => {
    if (isLoggedIn()) {
      const item = await logsApi.addCustom(label, category)
      set((state) => ({
        customSymptoms: [
          ...state.customSymptoms,
          { id: item.id, label: item.label, category: item.category as SymptomCategory },
        ],
      }))
    } else {
      const randomId = Math.random().toString(36).substring(7)
      set((state) => ({
        customSymptoms: [
          ...state.customSymptoms,
          { id: randomId, label, category },
        ],
      }))
    }
  },

  removeCustomSymptom: async (id) => {
    if (isLoggedIn()) {
      await logsApi.removeCustom(id)
    }
    set((state) => ({
      customSymptoms: state.customSymptoms.filter((s) => s.id !== id),
    }))
  },
})

import type { StateCreator } from 'zustand'
import type { AppState, LogsSlice } from '../types'
import type { SymptomCategory } from '../../data/symptomsData'
import { isLoggedIn } from '../../lib/auth-token'
import { logsApi } from '../../services/logsService'
import { userApi, userKeys } from '../../services/userService'
import { queryClient } from '../../lib/queryClient'
import { toast } from 'sonner'

const OFFLINE_LOGS_KEY = 'mensflow-offline-logs:v1'
const OLD_OFFLINE_LOGS_KEY = 'mensflow-offline-logs'

let cachedQueue: any[] | null = null

function getOfflineQueue(): any[] {
  if (cachedQueue !== null) {
    return cachedQueue
  }
  try {
    const oldQueueJson = localStorage.getItem(OLD_OFFLINE_LOGS_KEY)
    if (oldQueueJson) {
      localStorage.setItem(OFFLINE_LOGS_KEY, oldQueueJson)
      localStorage.removeItem(OLD_OFFLINE_LOGS_KEY)
      const parsed = JSON.parse(oldQueueJson) || []
      cachedQueue = parsed
      return parsed
    }
    const queueJson = localStorage.getItem(OFFLINE_LOGS_KEY)
    const parsed = queueJson ? JSON.parse(queueJson) : []
    cachedQueue = parsed
    return parsed
  } catch (err) {
    console.error('Failed to read offline logs queue:', err)
    return []
  }
}

function setOfflineQueue(queue: any[]) {
  cachedQueue = queue
  try {
    localStorage.setItem(OFFLINE_LOGS_KEY, JSON.stringify(queue))
  } catch (err) {
    console.error('Failed to write offline logs queue:', err)
  }
}

function clearOfflineQueue() {
  cachedQueue = []
  try {
    localStorage.removeItem(OFFLINE_LOGS_KEY)
  } catch (err) {
    console.error('Failed to clear offline logs queue:', err)
  }
}

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
          const isOffline = typeof navigator !== 'undefined' && !navigator.onLine
          if (isOffline || (err instanceof Error && (err.message.includes('fetch') || err.message.includes('NetworkError') || err.message.includes('Failed to fetch')))) {
            const queue = getOfflineQueue()
            const filteredQueue = queue.filter((item: any) => item.date !== date)
            filteredQueue.push({ date, symptoms, water: targetWater ?? 1000, weight: targetWeight ?? 62.5, lhLevel: targetLhLevel ?? null, mucus: targetMucus ?? null })
            setOfflineQueue(filteredQueue)
            toast.info('Saved locally. Will sync when online.')
          } else {
            set({ logs: previousLogs })
            throw err
          }
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
        const previousLogs = get().logs
        set((state) => ({
          logs: [
            ...state.logs.filter((l) => l.date !== date),
            { date, symptoms: existingSymptoms, water: targetWater, weight: targetWeight, lhLevel: targetLhLevel, mucus: targetMucus },
          ],
        }))
        try {
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
        } catch (err) {
          const isOffline = typeof navigator !== 'undefined' && !navigator.onLine
          if (isOffline || (err instanceof Error && (err.message.includes('fetch') || err.message.includes('NetworkError') || err.message.includes('Failed to fetch')))) {
            const queue = getOfflineQueue()
            const filteredQueue = queue.filter((item: any) => item.date !== date)
            filteredQueue.push({ date, symptoms: existingSymptoms, water: targetWater, weight: targetWeight, lhLevel: targetLhLevel, mucus: targetMucus })
            setOfflineQueue(filteredQueue)
            toast.info('Metrics saved locally. Will sync when online.')
          } else {
            set({ logs: previousLogs })
            throw err
          }
        }
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

  syncOfflineLogs: async () => {
    if (!isLoggedIn()) return
    const queue = getOfflineQueue()
    if (!queue || queue.length === 0) return

    toast.loading('Syncing offline updates...', { id: 'mensflow-sync' })

    const results = await Promise.allSettled(
      queue.map((item: any) =>
        logsApi.upsert(
          item.date,
          item.symptoms,
          item.water,
          item.weight,
          item.lhLevel,
          item.mucus
        ).then(() => ({ success: true, item }))
         .catch((err) => {
           console.error('Failed to sync offline log for date:', item.date, err)
           return { success: false, item }
         })
      )
    )

    let successCount = 0
    const remainingQueue: any[] = []

    for (const res of results) {
      if (res.status === 'fulfilled') {
        if (res.value.success) {
          successCount++
        } else {
          remainingQueue.push(res.value.item)
        }
      } else {
        console.error('Unexpected promise rejection during sync', res.reason)
      }
    }

    if (remainingQueue.length > 0) {
      setOfflineQueue(remainingQueue)
    } else {
      clearOfflineQueue()
    }

    if (successCount > 0) {
      toast.success(`Successfully synced ${successCount} offline logs!`, { id: 'mensflow-sync' })
      try {
        const freshLogs = await logsApi.getAll()
        set({ logs: freshLogs })
        queryClient.invalidateQueries({ queryKey: ['symptomLogs'] })
        queryClient.invalidateQueries({ queryKey: ['monthInReview'] })
        queryClient.invalidateQueries({ queryKey: userKeys.profile })
      } catch (err) {
        console.error('Error refreshing state after offline sync:', err)
      }
    } else {
      toast.dismiss('mensflow-sync')
    }
  },
})

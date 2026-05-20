import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { 
  type DashboardSnapshot, 
  DEFAULT_DASHBOARD 
} from '../lib/dashboardStorage'
import {
  DEFAULT_SETTINGS,
  type MensFlowSettings,
} from '../context/settings-types'
import { type SymptomDef, type SymptomCategory } from '../data/symptomsData'

export type SymptomLog = {
  date: string; // ISO date string (YYYY-MM-DD)
  symptoms: string[];
}

interface AppState {
  dashboard: DashboardSnapshot
  settings: MensFlowSettings
  logs: SymptomLog[]
  user: { name: string }
  customSymptoms: SymptomDef[]
  isSaving: boolean
  
  // Actions
  updateDashboard: (patch: Partial<DashboardSnapshot>) => Promise<void>
  updateUser: (patch: Partial<{ name: string }>) => void
  updateSettings: (patch: Partial<MensFlowSettings>) => void
  resetSettings: () => void
  addLog: (date: string, symptoms: string[]) => Promise<void>
  getLogForDate: (date: string) => SymptomLog | undefined
  clearLogs: () => void
  addCustomSymptom: (label: string, category: SymptomCategory) => void
  removeCustomSymptom: (id: string) => void
  resetStore: () => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      dashboard: DEFAULT_DASHBOARD,
      settings: DEFAULT_SETTINGS,
      logs: [],
      user: { name: 'Daniella' },
      customSymptoms: [],
      isSaving: false,

      updateUser: (patch) => set((state) => ({ user: { ...state.user, ...patch } })),
      updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),

      resetStore: () => set({
        dashboard: DEFAULT_DASHBOARD,
        settings: DEFAULT_SETTINGS,
        logs: [],
        user: { name: 'Daniella' },
        customSymptoms: [],
        isSaving: false
      }),

      updateDashboard: async (patch) => {
        set({ isSaving: true })
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        set((state) => ({
          dashboard: { ...state.dashboard, ...patch },
          isSaving: false
        }))
      },

      addLog: async (date, symptoms) => {
        set({ isSaving: true })
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800))
        set((state) => {
          const filteredLogs = state.logs.filter(log => log.date !== date)
          return {
            logs: [...filteredLogs, { date, symptoms }],
            isSaving: false
          }
        })
      },

      getLogForDate: (date) => {
        return get().logs.find(log => log.date === date)
      },

      clearLogs: () => set({ logs: [] }),

      addCustomSymptom: (label, category) => set((state) => {
        const id = `custom-${category.toLowerCase()}-${Date.now()}`
        return {
          customSymptoms: [...state.customSymptoms, { id, label, category }]
        }
      }),

      removeCustomSymptom: (id) => set((state) => ({
        customSymptoms: state.customSymptoms.filter((s) => s.id !== id)
      })),
    }),
    {
      name: 'mensflow-storage',
    }
  )
)

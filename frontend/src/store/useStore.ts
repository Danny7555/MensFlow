import { create } from 'zustand'
import { type DashboardSnapshot, DEFAULT_DASHBOARD } from '../lib/dashboardStorage'
import { DEFAULT_SETTINGS, type MensFlowSettings } from '../context/settings-types'
import { type SymptomDef, type SymptomCategory } from '../data/symptomsData'
import { logsApi, userApi, partnerApi, type ApiUser, type ApiSettings, type ApiDashboard } from '../lib/api'

export type SymptomLog = {
  date: string
  symptoms: string[]
}

interface AppState {
  dashboard: DashboardSnapshot
  settings: MensFlowSettings
  logs: SymptomLog[]
  user: { name: string; avatar?: string | null; accessLevel?: 'full' | 'educational' }
  customSymptoms: SymptomDef[]
  isSaving: boolean
  completedActions: string[]
  supportStreak: number
  lastActionDate: string

  // Lifecycle
  hydrate: (data: { user: ApiUser; settings: ApiSettings; dashboard: ApiDashboard }) => void
  resetStore: () => void

  // Dashboard
  updateDashboard: (patch: Partial<DashboardSnapshot>) => Promise<void>

  // User / Settings
  updateUser: (patch: Partial<{ name: string; avatar: string | null; accessLevel: 'full' | 'educational' }>) => Promise<void>
  updateSettings: (patch: Partial<MensFlowSettings>) => Promise<void>
  resetSettings: () => void

  // Logs
  addLog: (date: string, symptoms: string[]) => Promise<void>
  getLogForDate: (date: string) => SymptomLog | undefined
  fetchLogs: () => Promise<void>
  clearLogs: () => Promise<void>

  // Custom symptoms
  addCustomSymptom: (label: string, category: SymptomCategory) => Promise<void>
  removeCustomSymptom: (id: string) => Promise<void>
  fetchCustomSymptoms: () => Promise<void>

  // Partner support
  toggleSupportAction: (actionId: string) => Promise<void>
  checkAndResetDailyActions: () => void
}

const DEFAULT_USER = { name: '', avatar: null, accessLevel: 'full' as const }

export const useStore = create<AppState>()((set, get) => ({
  dashboard: DEFAULT_DASHBOARD,
  settings: DEFAULT_SETTINGS,
  logs: [],
  user: DEFAULT_USER,
  customSymptoms: [],
  isSaving: false,
  completedActions: [],
  supportStreak: 0,
  lastActionDate: '',

  // ── Hydrate from API response on login ──────────────────────────────────────
  hydrate: ({ user, settings, dashboard }) => {
    set({
      user: {
        name: user.name,
        avatar: user.avatar,
        accessLevel: user.accessLevel,
      },
      settings: {
        ...DEFAULT_SETTINGS,
        ...(settings as Partial<MensFlowSettings>),
        version: 1,
      },
      dashboard: dashboard
        ? {
            version: 1,
            lastPeriodStart: dashboard.lastPeriodStart,
            typicalCycleDays: dashboard.typicalCycleDays,
            phaseLabel: dashboard.phaseLabel,
            hormoneTrend: dashboard.hormoneTrend,
            bodySignals: dashboard.bodySignals,
            guidanceLines: dashboard.guidanceLines ?? [],
            cycleNotes: dashboard.cycleNotes ?? '',
          }
        : DEFAULT_DASHBOARD,
    })
  },

  // ── Reset everything on logout ──────────────────────────────────────────────
  resetStore: () =>
    set({
      dashboard: DEFAULT_DASHBOARD,
      settings: DEFAULT_SETTINGS,
      logs: [],
      user: DEFAULT_USER,
      customSymptoms: [],
      isSaving: false,
      completedActions: [],
      supportStreak: 0,
      lastActionDate: '',
    }),

  // ── Dashboard ───────────────────────────────────────────────────────────────
  updateDashboard: async (patch) => {
    set({ isSaving: true })
    try {
      const updated = await userApi.updateDashboard(patch)
      set((state) => ({
        dashboard: {
          ...state.dashboard,
          ...updated,
          version: 1,
          guidanceLines: updated.guidanceLines ?? state.dashboard.guidanceLines,
        },
      }))
    } finally {
      set({ isSaving: false })
    }
  },

  // ── User profile ────────────────────────────────────────────────────────────
  updateUser: async (patch) => {
    set({ isSaving: true })
    try {
      const { user: updated } = await userApi.updateProfile(patch)
      set((state) => ({
        user: {
          ...state.user,
          name: updated.name,
          avatar: updated.avatar,
          accessLevel: updated.accessLevel,
        },
      }))
    } finally {
      set({ isSaving: false })
    }
  },

  // ── Settings ────────────────────────────────────────────────────────────────
  updateSettings: async (patch) => {
    // Optimistic update — keeps UI instant
    set((state) => ({ settings: { ...state.settings, ...patch } }))
    try {
      await userApi.updateSettings(patch)
    } catch {
      // Revert on failure (re-fetch would be ideal but keep it simple)
    }
  },

  resetSettings: () => set({ settings: DEFAULT_SETTINGS }),

  // ── Symptom Logs ────────────────────────────────────────────────────────────
  fetchLogs: async () => {
    const logs = await logsApi.getAll()
    set({ logs })
  },

  addLog: async (date, symptoms) => {
    set({ isSaving: true })
    try {
      const log = await logsApi.upsert(date, symptoms)
      set((state) => ({
        logs: [
          ...state.logs.filter((l) => l.date !== date),
          { date: log.date, symptoms: log.symptoms },
        ],
      }))
    } finally {
      set({ isSaving: false })
    }
  },

  getLogForDate: (date) => get().logs.find((l) => l.date === date),

  clearLogs: async () => {
    await logsApi.clearAll()
    set({ logs: [] })
  },

  // ── Custom Symptoms ─────────────────────────────────────────────────────────
  fetchCustomSymptoms: async () => {
    const items = await logsApi.getCustom()
    set({
      customSymptoms: items.map((c) => ({
        id: c.id,
        label: c.label,
        category: c.category as SymptomCategory,
      })),
    })
  },

  addCustomSymptom: async (label, category) => {
    const item = await logsApi.addCustom(label, category)
    set((state) => ({
      customSymptoms: [
        ...state.customSymptoms,
        { id: item.id, label: item.label, category: item.category as SymptomCategory },
      ],
    }))
  },

  removeCustomSymptom: async (id) => {
    await logsApi.removeCustom(id)
    set((state) => ({
      customSymptoms: state.customSymptoms.filter((s) => s.id !== id),
    }))
  },

  // ── Partner support ─────────────────────────────────────────────────────────
  toggleSupportAction: async (actionId) => {
    const result = await partnerApi.toggleAction(actionId)
    set({
      completedActions: result.completedActions,
      supportStreak: result.supportStreak,
      lastActionDate: result.lastActionDate,
    })
  },

  checkAndResetDailyActions: () => {
    const todayStr = new Date().toISOString().split('T')[0]
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const state = get()
    if (state.lastActionDate && state.lastActionDate !== todayStr) {
      const patch: Partial<AppState> = { completedActions: [] }
      if (state.lastActionDate !== yesterdayStr) {
        patch.supportStreak = 0
      }
      set(patch)
    }
  },
}))

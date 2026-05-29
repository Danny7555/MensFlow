import { create } from 'zustand'
import { type DashboardSnapshot, DEFAULT_DASHBOARD } from '../lib/dashboardStorage'
import { DEFAULT_SETTINGS, type MensFlowSettings } from '../context/settings-types'
import { type SymptomDef, type SymptomCategory } from '../data/symptomsData'
import { logsApi } from '../services/logsService'
import { userApi, type ApiUser, type ApiSettings, type ApiDashboard } from '../services/userService'
import { partnerApi } from '../services/partnerService'
import { toast } from 'sonner'
import { isLoggedIn } from '../lib/auth-token'

export type SymptomLog = {
  date: string
  symptoms: string[]
}

export type AppUser = {
  name: string
  avatar?: string | null
  accessLevel?: 'full' | 'educational'
  isOnboarded?: boolean
  role?: 'lady' | 'partner'
  partnerCode?: string
  partnerId?: string | null
}

interface AppState {
  dashboard: DashboardSnapshot
  settings: MensFlowSettings
  logs: SymptomLog[]
  user: { name: string; avatar?: string | null; accessLevel?: 'full' | 'educational'; isOnboarded?: boolean; role?: 'lady' | 'partner'; partnerCode?: string; partnerId?: string | null }
  customSymptoms: SymptomDef[]
  isSaving: boolean
  completedActions: string[]
  supportStreak: number
  lastActionDate: string
  partnerStatus: {
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
    } | null
    support?: {
      completedActions: string[]
      supportStreak: number
      lastActionDate: string
    }
  } | null

  // Lifecycle
  hydrate: (data: { user: ApiUser; settings: ApiSettings; dashboard: ApiDashboard }) => void
  resetStore: () => void

  // Dashboard
  updateDashboard: (patch: Partial<DashboardSnapshot>) => Promise<void>

  // User / Settings
  updateUser: (patch: Partial<{ name: string; avatar: string | null; accessLevel: 'full' | 'educational'; isOnboarded: boolean; role: 'lady' | 'partner' }>) => Promise<void>
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
  fetchPartnerStatus: () => Promise<void>
  pairPartner: (partnerCode: string) => Promise<void>
  disconnectPartnerAction: () => Promise<void>
}

const DEFAULT_USER = { name: '', avatar: null, accessLevel: 'full' as const, isOnboarded: false, role: 'lady' as const, partnerCode: '', partnerId: null }

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
  partnerStatus: null,

  // ── Hydrate from API response on login ──────────────────────────────────────
  hydrate: ({ user, settings, dashboard }) => {
    set({
      user: {
        name: user.name,
        avatar: user.avatar,
        accessLevel: user.accessLevel,
        isOnboarded: user.isOnboarded,
        role: user.role,
        partnerCode: user.partnerCode,
        partnerId: user.partnerId,
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
            cycleVariationDays: dashboard.cycleVariationDays ?? 36,
            isAtypical: dashboard.isAtypical ?? true,
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
      partnerStatus: null,
    }),

  // ── Dashboard ───────────────────────────────────────────────────────────────
  updateDashboard: async (patch) => {
    set({ isSaving: true })
    try {
      if (isLoggedIn()) {
        const updated = await userApi.updateDashboard(patch)
        set((state) => ({
          dashboard: {
            ...state.dashboard,
            ...updated,
            version: 1,
            guidanceLines: updated.guidanceLines ?? state.dashboard.guidanceLines,
          },
        }))
      } else {
        set((state) => ({
          dashboard: {
            ...state.dashboard,
            ...patch,
            version: 1,
          },
        }))
      }
    } finally {
      set({ isSaving: false })
    }
  },

  // ── User profile ────────────────────────────────────────────────────────────
  updateUser: async (patch) => {
    set({ isSaving: true })
    try {
      if (isLoggedIn()) {
        const { user: updated } = await userApi.updateProfile(patch)
        set((state) => ({
          user: {
            ...state.user,
            name: updated.name,
            avatar: updated.avatar,
            accessLevel: updated.accessLevel,
            isOnboarded: updated.isOnboarded,
            role: updated.role,
            partnerCode: updated.partnerCode,
            partnerId: updated.partnerId,
          },
        }))
      } else {
        set((state) => ({
          user: {
            ...state.user,
            ...patch,
          },
        }))
      }
    } finally {
      set({ isSaving: false })
    }
  },

  // ── Settings ────────────────────────────────────────────────────────────────
  updateSettings: async (patch) => {
    // Optimistic update — keeps UI instant
    set((state) => ({ settings: { ...state.settings, ...patch } }))
    if (isLoggedIn()) {
      try {
        await userApi.updateSettings(patch)
      } catch {
        // Revert on failure (re-fetch would be ideal but keep it simple)
      }
    }
  },

  resetSettings: () => set({ settings: DEFAULT_SETTINGS }),

  // ── Symptom Logs ────────────────────────────────────────────────────────────
  fetchLogs: async () => {
    if (isLoggedIn()) {
      const logs = await logsApi.getAll()
      set({ logs })
    }
  },

  addLog: async (date, symptoms) => {
    set({ isSaving: true })
    try {
      if (isLoggedIn()) {
        const log = await logsApi.upsert(date, symptoms)
        set((state) => ({
          logs: [
            ...state.logs.filter((l) => l.date !== date),
            { date: log.date, symptoms: log.symptoms },
          ],
        }))
      } else {
        set((state) => ({
          logs: [
            ...state.logs.filter((l) => l.date !== date),
            { date, symptoms },
          ],
        }))
      }
    } finally {
      set({ isSaving: false })
    }
  },

  getLogForDate: (date) => get().logs.find((l) => l.date === date),

  clearLogs: async () => {
    if (isLoggedIn()) {
      await logsApi.clearAll()
    }
    set({ logs: [] })
  },

  // ── Custom Symptoms ─────────────────────────────────────────────────────────
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

  // ── Partner support ─────────────────────────────────────────────────────────
  toggleSupportAction: async (actionId) => {
    if (isLoggedIn()) {
      const result = await partnerApi.toggleAction(actionId)
      set({
        completedActions: result.completedActions,
        supportStreak: result.supportStreak,
        lastActionDate: result.lastActionDate,
      })
    } else {
      set((state) => {
        const completed = state.completedActions.includes(actionId)
          ? state.completedActions.filter(id => id !== actionId)
          : [...state.completedActions, actionId]
        return {
          completedActions: completed,
          lastActionDate: new Date().toISOString().split('T')[0]
        }
      })
    }
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

  fetchPartnerStatus: async () => {
    try {
      const status = await partnerApi.getStatus()
      set({ 
        partnerStatus: status,
        completedActions: status.support?.completedActions ?? [],
        supportStreak: status.support?.supportStreak ?? 0,
        lastActionDate: status.support?.lastActionDate ?? '',
      })
    } catch (err) {
      console.error('Failed to fetch partner status:', err)
    }
  },

  pairPartner: async (partnerCode) => {
    set({ isSaving: true })
    try {
      const result = await partnerApi.pair(partnerCode)
      const profile = await userApi.getProfile()
      get().hydrate({ user: profile.user, settings: profile.settings, dashboard: profile.dashboard })
      await get().fetchPartnerStatus()
      toast.success(`Successfully paired with ${result.partner.name}!`, { icon: '❤️' })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to pair with partner')
    } finally {
      set({ isSaving: false })
    }
  },

  disconnectPartnerAction: async () => {
    set({ isSaving: true })
    try {
      await partnerApi.disconnect()
      const profile = await userApi.getProfile()
      get().hydrate({ user: profile.user, settings: profile.settings, dashboard: profile.dashboard })
      set({ partnerStatus: null })
      toast.success('Successfully disconnected from partner')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to disconnect from partner')
    } finally {
      set({ isSaving: false })
    }
  },
}))

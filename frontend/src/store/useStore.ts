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
  water?: number
  weight?: number
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
  updateDailyMetrics: (date: string, water?: number, weight?: number) => Promise<void>
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
  invitePartner: (email: string) => Promise<void>
  disconnectPartnerAction: () => Promise<void>

  // Confirmation / Alerts
  confirmDialog: {
    isOpen: boolean
    title: string
    description: string
    onConfirm: (() => void) | null
    onCancel: (() => void) | null
  }
  showConfirm: (options: { title: string; description: string; onConfirm: () => void; onCancel?: () => void }) => void
  closeConfirm: () => void
  
  alertDialog: {
    isOpen: boolean
    title: string
    description: string
  }
  showAlert: (options: { title: string; description: string }) => void
  closeAlert: () => void
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

  confirmDialog: {
    isOpen: false,
    title: '',
    description: '',
    onConfirm: null,
    onCancel: null,
  },
  showConfirm: (options) => {
    set({
      confirmDialog: {
        isOpen: true,
        title: options.title,
        description: options.description,
        onConfirm: options.onConfirm,
        onCancel: options.onCancel || null,
      },
    })
  },
  closeConfirm: () => {
    set((state) => ({
      confirmDialog: {
        ...state.confirmDialog,
        isOpen: false,
      },
    }))
  },

  alertDialog: {
    isOpen: false,
    title: '',
    description: '',
  },
  showAlert: (options) => {
    set({
      alertDialog: {
        isOpen: true,
        title: options.title,
        description: options.description,
      },
    })
  },
  closeAlert: () => {
    set((state) => ({
      alertDialog: {
        ...state.alertDialog,
        isOpen: false,
      },
    }))
  },

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
            scientificInsight: dashboard.scientificInsight ?? '',
            dailyTip: dashboard.dailyTip ?? { title: '', desc: '' },
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
      confirmDialog: {
        isOpen: false,
        title: '',
        description: '',
        onConfirm: null,
        onCancel: null,
      },
      alertDialog: {
        isOpen: false,
        title: '',
        description: '',
      },
    }),

  // ── Dashboard ───────────────────────────────────────────────────────────────
  updateDashboard: async (patch) => {
    set({ isSaving: true })
    try {
      const settingsPatch = patch.typicalCycleDays !== undefined
        ? { cycleAvgLengthDays: patch.typicalCycleDays }
        : null

      if (isLoggedIn()) {
        const updated = await userApi.updateDashboard(patch)
        set((state) => ({
          dashboard: {
            ...state.dashboard,
            ...updated,
            version: 1,
            guidanceLines: updated.guidanceLines ?? state.dashboard.guidanceLines,
          },
          settings: settingsPatch 
            ? { ...state.settings, ...settingsPatch } 
            : state.settings,
        }))
        if (settingsPatch) {
          await userApi.updateSettings(settingsPatch)
        }
      } else {
        set((state) => ({
          dashboard: {
            ...state.dashboard,
            ...patch,
            version: 1,
          },
          settings: settingsPatch 
            ? { ...state.settings, ...settingsPatch } 
            : state.settings,
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
    const dashboardPatch = patch.cycleAvgLengthDays !== undefined
      ? { typicalCycleDays: patch.cycleAvgLengthDays }
      : null

    set((state) => ({ 
      settings: { ...state.settings, ...patch },
      dashboard: dashboardPatch
        ? { ...state.dashboard, ...dashboardPatch }
        : state.dashboard,
    }))

    if (isLoggedIn()) {
      try {
        await userApi.updateSettings(patch)
        if (dashboardPatch) {
          await userApi.updateDashboard(dashboardPatch)
        }
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
      const existing = get().logs.find((l) => l.date === date)
      const targetWater = existing?.water
      const targetWeight = existing?.weight

      if (isLoggedIn()) {
        const log = await logsApi.upsert(date, symptoms, targetWater, targetWeight)
        set((state) => ({
          logs: [
            ...state.logs.filter((l) => l.date !== date),
            { date: log.date, symptoms: log.symptoms, water: log.water, weight: log.weight },
          ],
        }))
      } else {
        set((state) => ({
          logs: [
            ...state.logs.filter((l) => l.date !== date),
            { date, symptoms, water: targetWater ?? 1000, weight: targetWeight ?? 62.5 },
          ],
        }))
      }
    } finally {
      set({ isSaving: false })
    }
  },

  updateDailyMetrics: async (date, water, weight) => {
    set({ isSaving: true })
    try {
      const existing = get().logs.find((l) => l.date === date)
      const existingSymptoms = existing?.symptoms ?? []
      const existingWater = existing?.water ?? 1000
      const existingWeight = existing?.weight ?? 62.5

      const targetWater = water !== undefined ? water : existingWater
      const targetWeight = weight !== undefined ? weight : existingWeight

      if (isLoggedIn()) {
        const log = await logsApi.upsert(date, undefined, targetWater, targetWeight)
        set((state) => ({
          logs: [
            ...state.logs.filter((l) => l.date !== date),
            { date: log.date, symptoms: log.symptoms, water: log.water, weight: log.weight },
          ],
        }))
      } else {
        set((state) => ({
          logs: [
            ...state.logs.filter((l) => l.date !== date),
            { date, symptoms: existingSymptoms, water: targetWater, weight: targetWeight },
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
      toast.success(`Successfully paired with ${result.partner.name}!`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to pair with partner')
    } finally {
      set({ isSaving: false })
    }
  },

  invitePartner: async (email) => {
    set({ isSaving: true })
    try {
      const result = await partnerApi.invite(email)
      if (result.partnerFound) {
        const profile = await userApi.getProfile()
        get().hydrate({ user: profile.user, settings: profile.settings, dashboard: profile.dashboard })
        await get().fetchPartnerStatus()
        toast.success(`Partner found! Successfully paired with ${result.name}!`)
      } else {
        toast.success(`Invitation email sent to ${email}!`, {
          description: `Once they sign up, they can pair with you using your code: ${get().user?.partnerCode || ''}`,
        })
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invitation')
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

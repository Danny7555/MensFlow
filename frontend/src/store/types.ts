import type { DashboardSnapshot } from '../lib/dashboardStorage'
import type { MensFlowSettings } from '../context/settings-types'
import type { SymptomDef, SymptomCategory } from '../data/symptomsData'
import type { ApiMonthInReview } from '../services/logsService'
import type { ApiUser, ApiSettings, ApiDashboard, ApiLoginRecord } from '../services/userService'
import type { ApiPartnerStatus } from '../services/partnerService'

export type SymptomLog = {
  date: string
  symptoms: string[]
  water?: number
  weight?: number
  lhLevel?: string | null
  mucus?: string | null
}

export type AppUser = {
  id?: string
  email?: string | null
  name: string
  avatar?: string | null
  accessLevel?: 'full' | 'educational'
  isOnboarded?: boolean
  role?: 'lady' | 'partner'
  onboardingData?: Record<string, unknown>
  partnerCode?: string
  partnerId?: string | null
  xp?: number
  quizLastCompletedAt?: string
  quizCountToday?: number
}

export interface UISlice {
  isSaving: boolean
  notificationCount: number
  incrementNotificationCount: () => void
  resetNotificationCount: () => void
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

export interface DashboardSlice {
  dashboard: DashboardSnapshot
  updateDashboard: (patch: Partial<DashboardSnapshot>) => Promise<void>
}

export interface UserSlice {
  user: AppUser
  updateUser: (patch: Partial<{ name: string; avatar: string | null; accessLevel: 'full' | 'educational'; isOnboarded: boolean; role: 'lady' | 'partner'; onboardingData: Record<string, unknown> }>) => Promise<void>
  submitQuizAttemptAction: (date: string, correct: boolean) => Promise<void>
}

export interface SettingsSlice {
  settings: MensFlowSettings
  updateSettings: (patch: Partial<MensFlowSettings>) => Promise<void>
  resetSettings: () => void
}

export interface LogsSlice {
  logs: SymptomLog[]
  monthInReview: ApiMonthInReview | null
  loginHistory: ApiLoginRecord[]
  customSymptoms: SymptomDef[]
  addLog: (date: string, symptoms: string[], lhLevel?: string | null, mucus?: string | null) => Promise<boolean>
  updateDailyMetrics: (date: string, water?: number, weight?: number, lhLevel?: string | null, mucus?: string | null) => Promise<boolean>
  getLogForDate: (date: string) => SymptomLog | undefined
  fetchLogs: () => Promise<void>
  fetchMonthInReview: () => Promise<void>
  fetchLoginHistory: () => Promise<void>
  clearLogs: () => Promise<void>
  addCustomSymptom: (label: string, category: SymptomCategory) => Promise<void>
  removeCustomSymptom: (id: string) => Promise<void>
  fetchCustomSymptoms: () => Promise<void>
  syncOfflineLogs: () => Promise<void>
}

export interface PartnerSlice {
  partnerStatus: ApiPartnerStatus | null
  completedActions: string[]
  supportStreak: number
  lastActionDate: string
  toggleSupportAction: (actionId: string) => Promise<void>
  checkAndResetDailyActions: () => void
  fetchPartnerStatus: () => Promise<void>
  pairPartner: (partnerCode: string) => Promise<void>
  invitePartner: (email: string) => Promise<void>
  disconnectPartnerAction: () => Promise<void>
  requestDetailedAccessAction: (requestedFields?: string[]) => Promise<void>
}

export interface LifecycleSlice {
  hydrate: (data: { user: ApiUser; settings: ApiSettings; dashboard: ApiDashboard }) => void
  resetStore: () => void
}

export type AppState = UISlice & DashboardSlice & UserSlice & SettingsSlice & LogsSlice & PartnerSlice & LifecycleSlice

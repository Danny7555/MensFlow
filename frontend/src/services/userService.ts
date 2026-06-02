import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, post, put } from '../lib/apiClient'
import { isLoggedIn } from '../lib/auth-token'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ApiUser = {
  id: string
  username: string
  email: string | null
  name: string
  avatar: string | null
  accessLevel: 'full' | 'educational'
  isOnboarded: boolean
  partnerCode: string
  partnerId: string | null
  role: 'lady' | 'partner'
  onboardingData: Record<string, unknown>
  xp: number
  quizLastCompletedAt: string
  quizCountToday: number
}

export type ApiSettings = {
  themeMode: 'light' | 'dark' | 'system'
  contrastMode: 'system' | 'standard'
  accentPreset: 'default' | 'orchid' | 'ocean'
  languageUi: 'auto' | 'en'
  spokenLanguage: 'auto' | 'en-US'
  enableDictation: boolean
  sidebarCollapsed: boolean
  notificationsEmail: boolean
  notificationsPush: boolean
  notificationsCycleReminders: boolean
  notificationsProduct: boolean
  privacyShareAnalytics: boolean
  privacyDefaultTemporaryChat: boolean
  privacyLockChats: boolean
  privacyLockChatsPassword: string | null
  privacyLockChatsSecurityQuestion: string | null
  privacyLockChatsSecurityAnswer: string | null
  chatPersistLocal: boolean
  chatEnterToSend: boolean
  chatShowTimestamps: boolean
  cycleAvgLengthDays: number
  cycleShowFertileWindow: boolean
  privacyShareCycleDetails: boolean
  privacyPendingAccessRequest: boolean
  privacyStrictLocalOnly: boolean
  conditionOptimization: 'none' | 'pcos' | 'endometriosis' | 'perimenopause'
  disableAIPopups: boolean
  hideDailyStoriesAndTips: boolean
  otpEnabled: boolean
  parentalControlsEnabled: boolean
  parentalGuardianEmail: string | null
  parentalContentFilter: 'standard' | 'restricted'
  parentalQuietHoursEnabled: boolean
  parentalQuietHoursStart: string
  parentalQuietHoursEnd: string
}

export type ApiDashboard = {
  lastPeriodStart: string
  typicalCycleDays: number
  phaseLabel: string
  hormoneTrend: string
  bodySignals: string
  guidanceLines: string[]
  cycleNotes: string
  cycleVariationDays: number
  isAtypical: boolean
  scientificInsight?: string
  dailyTip?: {
    title: string
    desc: string
  }
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

export const userApi = {
  getProfile: () =>
    get<{ user: ApiUser; settings: ApiSettings; dashboard: ApiDashboard }>('/user/profile'),

  updateProfile: (patch: Partial<Pick<ApiUser, 'name' | 'avatar' | 'accessLevel' | 'isOnboarded' | 'role' | 'onboardingData'>>) =>
    put<{ user: ApiUser }>('/user/profile', patch),

  updateSettings: (patch: Partial<ApiSettings>) =>
    put<ApiSettings>('/user/settings', patch),

  updateDashboard: (patch: Partial<ApiDashboard>) =>
    put<ApiDashboard>('/user/dashboard', patch),

  submitQuizAttempt: (date: string, correct: boolean) =>
    post<{ success: boolean; user: ApiUser }>('/user/xp', { date, correct }),
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export const userKeys = {
  profile: ['userProfile'] as const,
}

export function useUserProfile() {
  return useQuery({
    queryKey: userKeys.profile,
    queryFn: () => userApi.getProfile(),
    enabled: isLoggedIn(),
  })
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patch: Partial<Pick<ApiUser, 'name' | 'avatar' | 'accessLevel' | 'isOnboarded' | 'role' | 'onboardingData'>>) =>
      userApi.updateProfile(patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.profile })
    },
  })
}

export function useUpdateSettingsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patch: Partial<ApiSettings>) =>
      userApi.updateSettings(patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.profile })
    },
  })
}

export function useUpdateDashboardMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patch: Partial<ApiDashboard>) =>
      userApi.updateDashboard(patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.profile })
    },
  })
}

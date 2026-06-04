import { get, post, put, upload } from '../lib/apiClient'


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
  contrastMode: 'system' | 'standard' | 'high'
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

export type ApiLoginRecord = {
  id: string
  ip: string
  userAgent: string
  timestamp: string
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

  getLoginHistory: () =>
    get<ApiLoginRecord[]>('/user/login-history'),

  uploadImage: (file: File, type: 'avatar' | 'cover') => {
    const formData = new FormData()
    formData.append('image', file)
    return upload<{ url: string }>(`/upload?type=${type}`, formData)
  },
}

export const userKeys = {
  profile: ['userProfile'] as const,
}


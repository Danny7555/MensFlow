export type ThemeMode = 'light' | 'dark' | 'system'

export type ContrastMode = 'system' | 'standard'

export type AccentPreset = 'default' | 'orchid' | 'ocean'

export type MensFlowSettings = {
  version: 1
  themeMode: ThemeMode
  contrastMode: ContrastMode
  accentPreset: AccentPreset
  languageUi: 'auto' | 'en'
  spokenLanguage: 'auto' | 'en-US'
  enableDictation: boolean
  /** Desktop icon-only rail when true */
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
  /** Two-factor authentication via email OTP */
  otpEnabled: boolean
  parentalControlsEnabled: boolean
  parentalGuardianEmail: string | null
  parentalContentFilter: 'standard' | 'restricted'
  parentalQuietHoursEnabled: boolean
  parentalQuietHoursStart: string
  parentalQuietHoursEnd: string
}

export const DEFAULT_SETTINGS: MensFlowSettings = {
  version: 1,
  themeMode: 'system',
  contrastMode: 'system',
  accentPreset: 'default',
  languageUi: 'auto',
  spokenLanguage: 'auto',
  enableDictation: false,
  sidebarCollapsed: false,
  notificationsEmail: false,
  notificationsPush: true,
  notificationsCycleReminders: true,
  notificationsProduct: false,
  privacyShareAnalytics: false,
  privacyDefaultTemporaryChat: false,
  privacyLockChats: false,
  privacyLockChatsPassword: null,
  privacyLockChatsSecurityQuestion: null,
  privacyLockChatsSecurityAnswer: null,
  chatPersistLocal: true,
  chatEnterToSend: true,
  chatShowTimestamps: false,
  cycleAvgLengthDays: 28,
  cycleShowFertileWindow: true,
  privacyShareCycleDetails: true,
  privacyPendingAccessRequest: false,
  privacyStrictLocalOnly: false,
  conditionOptimization: 'none',
  disableAIPopups: false,
  hideDailyStoriesAndTips: false,
  otpEnabled: true,
  parentalControlsEnabled: false,
  parentalGuardianEmail: null,
  parentalContentFilter: 'standard',
  parentalQuietHoursEnabled: false,
  parentalQuietHoursStart: '21:00',
  parentalQuietHoursEnd: '06:00',
}

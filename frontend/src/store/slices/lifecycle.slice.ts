import type { StateCreator } from 'zustand'
import type { AppState, LifecycleSlice, AppUser } from '../types'
import { DEFAULT_DASHBOARD } from '../../lib/dashboardStorage'
import { DEFAULT_SETTINGS } from '../../context/settings-types'
import { getDefaultUser } from './user.slice'

function freshUser(): AppUser {
  if (typeof window === 'undefined') return getDefaultUser()
  const role = localStorage.getItem('mensflow_user_role') as 'lady' | 'partner' | null
  return { ...getDefaultUser(), role: role || 'lady' }
}

export const createLifecycleSlice: StateCreator<AppState, [], [], LifecycleSlice> = (_set, _get) => ({
  hydrate: ({ user, settings, dashboard }) => {
    const nextSettings = {
      ...DEFAULT_SETTINGS,
      ...(settings as Partial<typeof DEFAULT_SETTINGS>),
      version: 1 as const,
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('mensflow-settings-v1', JSON.stringify(nextSettings))
    }

    _set({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        accessLevel: user.accessLevel,
        isOnboarded: user.isOnboarded,
        role: user.role,
        onboardingData: user.onboardingData || {},
        partnerCode: user.partnerCode,
        partnerId: user.partnerId,
        xp: user.xp || 0,
        quizLastCompletedAt: user.quizLastCompletedAt || '',
        quizCountToday: user.quizCountToday || 0,
      },
      settings: nextSettings,
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

  resetStore: () =>
    _set({
      dashboard: DEFAULT_DASHBOARD,
      settings: DEFAULT_SETTINGS,
      logs: [],
      monthInReview: null,
      loginHistory: [],
      user: freshUser(),
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
})

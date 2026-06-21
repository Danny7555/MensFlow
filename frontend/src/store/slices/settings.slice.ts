import type { StateCreator } from 'zustand'
import type { AppState, SettingsSlice } from '../types'
import { DEFAULT_SETTINGS, type MensFlowSettings } from '../../context/settings-types'
import { isLoggedIn } from '../../lib/auth-token'
import { userApi, userKeys } from '../../services/userService'
import { queryClient } from '../../lib/queryClient'

function loadSavedSettings(): MensFlowSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem('mensflow-settings-v1')
    if (!raw) return DEFAULT_SETTINGS
    const saved = JSON.parse(raw)
    return { ...DEFAULT_SETTINGS, ...saved, version: 1 }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export const createSettingsSlice: StateCreator<AppState, [], [], SettingsSlice> = (set, get) => ({
  settings: loadSavedSettings(),

  updateSettings: async (patch) => {
    const dashboardPatch = patch.cycleAvgLengthDays !== undefined
      ? { typicalCycleDays: patch.cycleAvgLengthDays }
      : null
    const wasLocalOnly = get().settings.privacyStrictLocalOnly

    set((state) => ({
      settings: { ...state.settings, ...patch },
      dashboard: dashboardPatch
        ? { ...state.dashboard, ...dashboardPatch }
        : state.dashboard,
    }))

    const shouldSync = isLoggedIn() && (!wasLocalOnly || patch.privacyStrictLocalOnly === false)

    if (shouldSync) {
      try {
        await userApi.updateSettings(patch)
        if (dashboardPatch) {
          await userApi.updateDashboard(dashboardPatch)
        }
        queryClient.invalidateQueries({ queryKey: userKeys.profile })
      } catch {
        /* revert handled by re-fetch */
      }
    }
  },

  resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
})

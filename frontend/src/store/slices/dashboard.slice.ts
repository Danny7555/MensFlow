import type { StateCreator } from 'zustand'
import type { AppState, DashboardSlice } from '../types'
import { DEFAULT_DASHBOARD } from '../../lib/dashboardStorage'
import { isLoggedIn } from '../../lib/auth-token'
import { userApi } from '../../services/userService'
import { queryClient } from '../../lib/queryClient'
import { userKeys } from '../../services/userService'

export const createDashboardSlice: StateCreator<AppState, [], [], DashboardSlice> = (set, get) => ({
  dashboard: DEFAULT_DASHBOARD,

  updateDashboard: async (patch) => {
    set({ isSaving: true })
    try {
      const settingsPatch = patch.typicalCycleDays !== undefined
        ? { cycleAvgLengthDays: patch.typicalCycleDays }
        : null

      const isLocalOnly = get().settings.privacyStrictLocalOnly

      if (isLoggedIn() && !isLocalOnly) {
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
        queryClient.invalidateQueries({ queryKey: userKeys.profile })
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
})

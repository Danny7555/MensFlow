import { create } from 'zustand'
import type { AppState } from './types'
import { createUISlice } from './slices/ui.slice'
import { createDashboardSlice } from './slices/dashboard.slice'
import { createUserSlice } from './slices/user.slice'
import { createSettingsSlice } from './slices/settings.slice'
import { createLogsSlice } from './slices/logs.slice'
import { createPartnerSlice } from './slices/partner.slice'
import { createLifecycleSlice } from './slices/lifecycle.slice'

export const useStore = create<AppState>()((...a) => ({
  ...createUISlice(...a),
  ...createDashboardSlice(...a),
  ...createUserSlice(...a),
  ...createSettingsSlice(...a),
  ...createLogsSlice(...a),
  ...createPartnerSlice(...a),
  ...createLifecycleSlice(...a),
}))

// Re-export types for backward compatibility with existing imports
export type { AppUser, SymptomLog, AppState } from './types'

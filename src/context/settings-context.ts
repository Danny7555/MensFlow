import { createContext } from 'react'
import type { MensFlowSettings } from './settings-types'

export type SettingsContextValue = {
  settings: MensFlowSettings
  updateSettings: (patch: Partial<MensFlowSettings>) => void
  resetSettings: () => void
}

export const SettingsContext = createContext<SettingsContextValue | null>(null)

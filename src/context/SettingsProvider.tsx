import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  DEFAULT_SETTINGS,
  type MensFlowSettings,
} from './settings-types'
import { SettingsContext } from './settings-context'
import { SETTINGS_STORAGE_KEY } from '../lib/constants'

function loadSettings(): MensFlowSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<MensFlowSettings>
    return { ...DEFAULT_SETTINGS, ...parsed, version: 1 }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<MensFlowSettings>(loadSettings)

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    } catch {
      /* ignore quota */
    }
  }, [settings])

  const updateSettings = useCallback((patch: Partial<MensFlowSettings>) => {
    setSettings((s) => ({ ...s, ...patch }))
  }, [])

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
  }, [])

  const value = useMemo(
    () => ({ settings, updateSettings, resetSettings }),
    [settings, updateSettings, resetSettings],
  )

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  )
}

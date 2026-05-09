import { useEffect } from 'react'
import { useSettings } from '../context/useSettings'
import { resolveEffectiveTheme } from '../lib/theme'

/** Applies data-theme + color-scheme on <html> from settings (and OS when system). */
export function ThemeSync() {
  const {
    settings: { themeMode },
  } = useSettings()

  useEffect(() => {
    const apply = () => {
      const resolved = resolveEffectiveTheme(themeMode)
      document.documentElement.dataset.theme = resolved
      document.documentElement.style.colorScheme = resolved
    }

    apply()

    if (themeMode !== 'system') return

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => apply()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [themeMode])

  return null
}

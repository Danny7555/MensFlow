import { useEffect } from 'react'
import { useStore } from '../store/useStore'
import { resolveEffectiveTheme } from '../lib/theme'

/** Applies data-theme, data-contrast, data-accent, + color-scheme on <html> from settings. */
export function ThemeSync() {
  const themeMode = useStore((state) => state.settings.themeMode)
  const contrastMode = useStore((state) => state.settings.contrastMode)
  const accentPreset = useStore((state) => state.settings.accentPreset)

  // 1. Synchronize theme Mode
  useEffect(() => {
    const applyTheme = () => {
      const resolved = resolveEffectiveTheme(themeMode)
      document.documentElement.dataset.theme = resolved
      document.documentElement.style.colorScheme = resolved
    }

    applyTheme()

    if (themeMode !== 'system') return

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [themeMode])

  // 2. Synchronize contrast mode
  useEffect(() => {
    const applyContrast = () => {
      let resolved = contrastMode
      if (contrastMode === 'system') {
        resolved = window.matchMedia('(prefers-contrast: more)').matches ? 'high' : 'standard'
      }
      document.documentElement.dataset.contrast = resolved
    }

    applyContrast()

    if (contrastMode !== 'system') return

    const mq = window.matchMedia('(prefers-contrast: more)')
    const onChange = () => applyContrast()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [contrastMode])

  // 3. Synchronize accent preset
  useEffect(() => {
    document.documentElement.dataset.accent = accentPreset
  }, [accentPreset])

  return null
}


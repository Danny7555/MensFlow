export function hapticMedium() {
  try { navigator.vibrate?.(8) } catch { /* noop */ }
}

export function hapticHeavy() {
  try { navigator.vibrate?.(14) } catch { /* noop */ }
}

export function hapticSelection() {
  try { navigator.vibrate?.(6) } catch { /* noop */ }
}

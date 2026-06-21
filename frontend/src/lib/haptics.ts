export function hapticLight() {
  try { navigator.vibrate?.(4) } catch { }
}

export function hapticMedium() {
  try { navigator.vibrate?.(8) } catch { }
}

export function hapticHeavy() {
  try { navigator.vibrate?.(14) } catch { }
}

export function hapticSelection() {
  try { navigator.vibrate?.(6) } catch { }
}

export function hapticNav() {
  hapticLight()
}

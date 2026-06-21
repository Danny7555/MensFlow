import { useEffect, useRef, useState } from 'react'

export function useAnimatedCounter(end: number, duration = 800, enabled = true) {
  const [value, setValue] = useState(enabled ? 0 : end)
  const endRef = useRef(end)
  const durationRef = useRef(duration)
  const valueRef = useRef(value)

  useEffect(() => {
    if (!enabled) return
    endRef.current = end
    durationRef.current = duration
    valueRef.current = value
    const from = valueRef.current
    const to = endRef.current
    const dur = durationRef.current
    const start = performance.now()
    let raf: number

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / dur, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(from + (to - from) * eased))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [enabled, end, duration, value])

  return value
}

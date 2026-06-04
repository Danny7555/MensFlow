import { useMemo } from 'react'
import { useStore } from '../store/useStore'
import { differenceInDays, parseISO } from 'date-fns'

export interface MonthInReviewStats {
  cycleLengthText: string
  energyText: string
  crampText: string
  partnerText: string
}

export function useMonthInReviewStats(): MonthInReviewStats {
  const { logs, dashboard, partnerStatus, monthInReview } = useStore()

  return useMemo(() => {
    // ── Fast path: use backend-calculated data when available ──────────────────
    if (monthInReview) {
      const cycleLengthText = `Your last cycle lasted ${monthInReview.cycleLength} days.`
      const energyText = `Energy was highest during Days ${monthInReview.energyPeakStart}–${monthInReview.energyPeakEnd}.`

      let crampText: string
      if (monthInReview.crampingChange < 0) {
        crampText = `Cramping decreased by ${Math.abs(monthInReview.crampingChange)}% compared to last month.`
      } else if (monthInReview.crampingChange > 0) {
        crampText = `Cramping increased by ${monthInReview.crampingChange}% compared to last month.`
      } else {
        crampText = 'Cramping remained stable compared to last month.'
      }

      const partnerText = `Your partner completed ${monthInReview.partnerActions} support action${monthInReview.partnerActions === 1 ? '' : 's'}.`

      return { cycleLengthText, energyText, crampText, partnerText }
    }

    // ── Fallback: client-side calculation (guest / local-only users) ───────────

    // 1. Group flow logs into periods to count cycle lengths
    const flowDates = (logs || [])
      .flatMap((l) => (l.symptoms.some((s) => s.startsWith('flow-')) ? [l.date] : []))
      .sort()

    const periodStarts: Date[] = []
    let prevDate: Date | null = null
    for (const dateStr of flowDates) {
      const d = parseISO(dateStr)
      if (!prevDate || differenceInDays(d, prevDate) > 4) {
        periodStarts.push(d)
      }
      prevDate = d
    }

    const cycleLengths: number[] = []
    for (let i = 0; i < periodStarts.length - 1; i++) {
      const len = differenceInDays(periodStarts[i + 1], periodStarts[i])
      cycleLengths.push(len)
    }

    const typicalCycleDays = dashboard.typicalCycleDays || 28
    const lastLen = cycleLengths.length > 0 ? cycleLengths[cycleLengths.length - 1] : typicalCycleDays
    const cycleLengthText = `Your last cycle lasted ${lastLen} days.`

    // 2. Compute energy peak window
    let activeCycleStart = dashboard.lastPeriodStart ? parseISO(dashboard.lastPeriodStart) : null
    if (periodStarts.length > 0) {
      activeCycleStart = periodStarts[periodStarts.length - 1]
    }

    const logsInCycle = (logs || []).filter((log) => {
      if (!activeCycleStart) return false
      const logDate = parseISO(log.date)
      const diff = differenceInDays(logDate, activeCycleStart)
      return diff >= 0 && diff < typicalCycleDays
    })

    const dayScores: Record<number, number> = {}
    logsInCycle.forEach((log) => {
      if (!activeCycleStart) return
      const logDate = parseISO(log.date)
      const day = differenceInDays(logDate, activeCycleStart) + 1

      let score = 3
      if (log.symptoms.includes('mood-happy')) score += 2
      if (log.symptoms.includes('mood-calm')) score += 1
      if (log.symptoms.includes('phys-fatigue')) score -= 2
      if (
        log.symptoms.includes('phys-cramps') ||
        log.symptoms.includes('endo-pelvicpain') ||
        log.symptoms.includes('endo-backache')
      )
        score -= 1

      dayScores[day] = score
    })

    // Find the 5-day window with the highest average energy
    let bestStart = 3
    let bestEnd = 8
    let maxAvg = -Infinity
    let foundWindow = false

    for (let startDay = 1; startDay <= typicalCycleDays - 4; startDay++) {
      let sum = 0
      let count = 0
      for (let d = startDay; d < startDay + 5; d++) {
        if (dayScores[d] !== undefined) {
          sum += dayScores[d]
          count++
        }
      }
      if (count >= 2) {
        const avg = sum / count
        if (avg > maxAvg) {
          maxAvg = avg
          bestStart = startDay
          bestEnd = startDay + 5
          foundWindow = true
        }
      }
    }

    if (!foundWindow && (logs || []).length > 0) {
      bestStart = 10
      bestEnd = 15
    }
    const energyText = `Energy was highest during Days ${bestStart}–${bestEnd}.`

    // 3. Compute cramping trend vs previous cycle
    let currentCrampingDays = 0
    let prevCrampingDays = 0
    let crampText = ''
    let calculatedCramps = false

    const hasCrampSymptom = (symptoms: string[]) =>
      symptoms.some((s) => s === 'phys-cramps' || s === 'endo-pelvicpain' || s === 'endo-backache')

    if (periodStarts.length >= 1) {
      const curStart = periodStarts[periodStarts.length - 1]
      const prevStart = periodStarts.length >= 2 ? periodStarts[periodStarts.length - 2] : null

      ;(logs || []).forEach((log) => {
        const logDate = parseISO(log.date)
        const hasCramps = hasCrampSymptom(log.symptoms)
        if (logDate >= curStart) {
          if (hasCramps) currentCrampingDays++
        } else if (prevStart && logDate >= prevStart && logDate < curStart) {
          if (hasCramps) prevCrampingDays++
        }
      })

      if (prevStart) {
        calculatedCramps = true
        if (prevCrampingDays > 0) {
          const pct = Math.round(((currentCrampingDays - prevCrampingDays) / prevCrampingDays) * 100)
          if (pct < 0) crampText = `Cramping decreased by ${Math.abs(pct)}% compared to last month.`
          else if (pct > 0) crampText = `Cramping increased by ${pct}% compared to last month.`
          else crampText = 'Cramping remained stable compared to last month.'
        } else {
          crampText =
            currentCrampingDays > 0
              ? `Logged cramps on ${currentCrampingDays} days this cycle.`
              : 'No cramping logged this cycle.'
        }
      } else {
        // Fallback: compare against 30 days before current start
        const prevMonthStart = new Date(curStart.getTime() - 30 * 24 * 3600 * 1000)
        ;(logs || []).forEach((log) => {
          const logDate = parseISO(log.date)
          if (logDate >= prevMonthStart && logDate < curStart) {
            if (hasCrampSymptom(log.symptoms)) prevCrampingDays++
          }
        })
        if (prevCrampingDays > 0) {
          calculatedCramps = true
          const pct = Math.round(((currentCrampingDays - prevCrampingDays) / prevCrampingDays) * 100)
          if (pct < 0) crampText = `Cramping decreased by ${Math.abs(pct)}% compared to last month.`
          else if (pct > 0) crampText = `Cramping increased by ${pct}% compared to last month.`
          else crampText = 'Cramping remained stable compared to last month.'
        }
      }
    }

    if (!calculatedCramps && (logs || []).length > 0) {
      const hasCramps = (logs || []).some((l) => hasCrampSymptom(l.symptoms))
      crampText = hasCramps ? 'Cramping reported occasionally this month.' : 'No cramping logged this month.'
    }

    if (!crampText) {
      crampText = 'No cramping logged this month.'
    }

    // 4. Partner support actions
    const partnerActions =
      partnerStatus?.support?.totalActionsThisCycle !== undefined
        ? partnerStatus.support.totalActionsThisCycle
        : 2
    const partnerText = `Your partner completed ${partnerActions} support action${partnerActions === 1 ? '' : 's'}.`

    return { cycleLengthText, energyText, crampText, partnerText }
  }, [logs, dashboard, partnerStatus, monthInReview])
}

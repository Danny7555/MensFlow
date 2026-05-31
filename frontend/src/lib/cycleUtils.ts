export function computeCycleDay(startIso: string, cycleLen: number): number {
  const safeCycleLen = Math.max(1, cycleLen || 28)
  const start = new Date(`${startIso}T12:00:00`)
  if (Number.isNaN(+start)) return 1
  const days = Math.floor((Date.now() - +start) / 86400000)
  const m = ((days % safeCycleLen) + safeCycleLen) % safeCycleLen
  return m + 1
}

export type CyclePhase = 'menstrual' | 'follicular' | 'fertile' | 'luteal'

/**
 * Returns the cycle phase for a given day, using cycle-length-aware thresholds.
 * - Ovulation is assumed at cycleLen - 14 (standard luteal phase length)
 * - Fertile window: 4 days before through 2 days after ovulation
 * - PMS / late luteal: last 5 days of the cycle
 * - Period: days 1-5, light trailing: days 6-7, then follicular until fertile window
 */
export function getPhaseFromDay(cycleDay: number, cycleLen = 28): CyclePhase {
  const safeCycleLen = Math.max(21, cycleLen)
  const periodLength = 5
  const predictedPeriodLength = 2
  const ovulationDay = Math.max(10, safeCycleLen - 14)
  const fertileStart = Math.max(periodLength + predictedPeriodLength + 1, ovulationDay - 4)
  const fertileEnd = ovulationDay + 2
  const pmsStart = safeCycleLen - 4  // last 5 days (days cycleLen-4 through cycleLen)

  // Days 1-7 are all considered menstrual (1-5 active flow, 6-7 light/fading flow)
  if (cycleDay <= periodLength + predictedPeriodLength) return 'menstrual'
  if (cycleDay >= fertileStart && cycleDay <= fertileEnd) return 'fertile'
  if (cycleDay >= pmsStart) return 'luteal'
  return 'follicular'
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export interface PhaseInfo {
  label: string
  color: string
  bgColor: string
  description: string
}

export function getPhaseInfo(phase: CyclePhase): PhaseInfo {
  switch (phase) {
    case 'menstrual':
      return {
        label: 'Menstrual',
        color: '#f43f5e',
        bgColor: 'rgba(244, 63, 94, 0.1)',
        description: 'Rest and restore. Your body is releasing and renewing.'
      }
    case 'follicular':
      return {
        label: 'Follicular',
        color: '#0d9488',
        bgColor: 'rgba(13, 148, 136, 0.1)',
        description: 'Energy is rising. Great time for new ideas and plans.'
      }
    case 'fertile':
      return {
        label: 'Ovulatory',
        color: '#26899e',
        bgColor: 'rgba(38, 137, 158, 0.1)',
        description: 'Peak social and physical energy. Highest fertility window.'
      }
    case 'luteal':
      return {
        label: 'Luteal',
        color: '#d97706',
        bgColor: 'rgba(217, 119, 6, 0.1)',
        description: 'Pre-period phase. Prioritise calm, comfort, and self-care.'
      }
    default:
      return {
        label: 'Unknown',
        color: '#999',
        bgColor: 'rgba(153, 153, 153, 0.1)',
        description: 'Tracking your cycle...'
      }
  }
}

export interface SupportTask {
  id: string
  label: string
}

export const getPhaseTasks = (phase: string): SupportTask[] => {
  const normalized = (phase || '').toLowerCase()
  if (normalized.includes('menstrual')) {
    return [
      { id: 'm-heating-pad', label: 'Prepare heating pad' },
      { id: 'm-ginger-tea', label: 'Offer warm ginger tea' },
      { id: 'm-physical-chores', label: 'Handle physical chores' }
    ]
  }
  if (normalized.includes('follicular')) {
    return [
      { id: 'f-outdoor', label: 'Plan outdoor activity' },
      { id: 'f-social', label: "Encourage a girl's night out / social space" },
      { id: 'f-surprise', label: 'Surprise with a small thoughtful gesture' }
    ]
  }
  if (normalized.includes('ovulatory') || normalized.includes('fertile') || normalized.includes('window')) {
    return [
      { id: 'o-date-night', label: 'Schedule special date night' },
      { id: 'o-post-it', label: 'Leave a handwritten post-it note' },
      { id: 'o-conversation', label: 'Initiate a creative connection' }
    ]
  }
  // Default to Luteal/PMS
  return [
    { id: 'l-comfort-snack', label: 'Pick up favorite comfort snack' },
    { id: 'l-heavy-discussions', label: 'Hold off on heavy/stressful debates' },
    { id: 'l-foot-massage', label: 'Run a soothing foot or back massage' }
  ]
}

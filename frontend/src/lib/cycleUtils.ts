export function computeCycleDay(startIso: string, cycleLen: number): number {
  const start = new Date(`${startIso}T12:00:00`)
  if (Number.isNaN(+start)) return 1
  const days = Math.floor((Date.now() - +start) / 86400000)
  const m = ((days % cycleLen) + cycleLen) % cycleLen
  return m + 1
}

export type CyclePhase = 'menstrual' | 'follicular' | 'fertile' | 'luteal'

export function getPhaseFromDay(cycleDay: number): CyclePhase {
  const periodLength = 5
  const predictedPeriodLength = 2
  const fertileStart = 10
  const fertileEnd = 16
  const upcomingStart = 23

  if (cycleDay <= periodLength) return 'menstrual'
  if (cycleDay <= periodLength + predictedPeriodLength) return 'follicular'
  if (cycleDay >= fertileStart && cycleDay <= fertileEnd) return 'fertile'
  if (cycleDay >= upcomingStart) return 'luteal'
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
        description: 'Time for rest and deep restoration.'
      }
    case 'follicular':
      return {
        label: 'Follicular',
        color: '#0d9488',
        bgColor: 'rgba(13, 148, 136, 0.1)',
        description: 'Energy is rising. Great for new ideas.'
      }
    case 'fertile':
      return {
        label: 'Ovulatory',
        color: '#0ea5e9',
        bgColor: 'rgba(14, 165, 233, 0.1)',
        description: 'Peak social and physical energy.'
      }
    case 'luteal':
      return {
        label: 'Luteal',
        color: '#d97706',
        bgColor: 'rgba(217, 119, 6, 0.1)',
        description: 'Focus on calm and comfort.'
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

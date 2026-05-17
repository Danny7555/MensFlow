import { DASHBOARD_STORAGE_KEY } from './constants'

export type DashboardSnapshot = {
  version: 1
  lastPeriodStart: string
  typicalCycleDays: number
  phaseLabel: string
  hormoneTrend: string
  bodySignals: string
  guidanceLines: string[]
  cycleNotes: string
}

export const DEFAULT_DASHBOARD: DashboardSnapshot = {
  version: 1,
  lastPeriodStart: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10),
  typicalCycleDays: 28,
  phaseLabel: 'Luteal',
  hormoneTrend: 'Progesterone rising',
  bodySignals: 'Fatigue, appetite changes',
  guidanceLines: [
    'Prioritize sleep (8+ hours)',
    'Increase healthy fats',
    'Focus on grounding exercises',
  ],
  cycleNotes: 'Luteal phase started. Monitoring fatigue and appetite changes.',
}

export function loadDashboard(): DashboardSnapshot {
  if (typeof window === 'undefined') return DEFAULT_DASHBOARD
  try {
    const raw = localStorage.getItem(DASHBOARD_STORAGE_KEY)
    if (!raw) return DEFAULT_DASHBOARD
    const p = JSON.parse(raw) as Partial<DashboardSnapshot>
    return {
      ...DEFAULT_DASHBOARD,
      ...p,
      version: 1,
      guidanceLines: Array.isArray(p.guidanceLines)
        ? p.guidanceLines
        : DEFAULT_DASHBOARD.guidanceLines,
    }
  } catch {
    return DEFAULT_DASHBOARD
  }
}

export function saveDashboard(s: DashboardSnapshot) {
  try {
    localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(s))
  } catch {
    /* quota */
  }
}

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
  lastPeriodStart: '',
  typicalCycleDays: 28,
  phaseLabel: '',
  hormoneTrend: 'No cycle data set',
  bodySignals: 'No symptoms logged today',
  guidanceLines: [],
  cycleNotes: '',
}

export function loadDashboard(): DashboardSnapshot {
  return DEFAULT_DASHBOARD
}

export function saveDashboard(_s: DashboardSnapshot) {
  // Stateless, dashboard values are loaded and stored directly on the backend
}

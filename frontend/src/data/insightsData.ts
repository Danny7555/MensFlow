export type InsightTrend = {
  id: string
  label: string
  value: string
  change: string
  positive: boolean
}

export type InsightMetric = {
  id: string
  title: string
  bars: number[]
  caption: string
}

export const INSIGHT_TRENDS_DUMMY: InsightTrend[] = [
  {
    id: '1',
    label: 'Cycle length',
    value: '28 days',
    change: '+1 day vs last 3',
    positive: false,
  },
  {
    id: '2',
    label: 'Symptom load',
    value: 'Moderate',
    change: '↓ from last month',
    positive: true,
  },
  {
    id: '3',
    label: 'Logged moods',
    value: '14 entries',
    change: 'Steady check-ins',
    positive: true,
  },
]

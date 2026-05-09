import { createContext } from 'react'
import type { DashboardSnapshot } from '../lib/dashboardStorage'

export type DashboardDataValue = {
  data: DashboardSnapshot
  update: (patch: Partial<DashboardSnapshot>) => void
  saveNow: () => void
  lastSaved: Date | null
}

export const DashboardDataContext =
  createContext<DashboardDataValue | null>(null)

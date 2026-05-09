import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  type DashboardSnapshot,
  loadDashboard,
  saveDashboard,
} from '../lib/dashboardStorage'
import { DashboardDataContext } from './dashboard-data-context'

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DashboardSnapshot>(() => loadDashboard())
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const update = useCallback((patch: Partial<DashboardSnapshot>) => {
    setData((d) => {
      const next = { ...d, ...patch }
      saveDashboard(next)
      return next
    })
    setLastSaved(new Date())
  }, [])

  const saveNow = useCallback(() => {
    saveDashboard(data)
    setLastSaved(new Date())
  }, [data])

  const value = useMemo(
    () => ({ data, update, saveNow, lastSaved }),
    [data, update, saveNow, lastSaved],
  )

  return (
    <DashboardDataContext.Provider value={value}>
      {children}
    </DashboardDataContext.Provider>
  )
}

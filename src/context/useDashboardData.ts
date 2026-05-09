import { useContext } from 'react'
import { DashboardDataContext } from './dashboard-data-context'

export function useDashboardData() {
  const x = useContext(DashboardDataContext)
  if (!x) throw new Error('useDashboardData requires DashboardDataProvider')
  return x
}

import { useLocation } from 'react-router-dom'
import { CalendarSkeleton } from './CalendarSkeleton'
import { ChatSkeleton } from './ChatSkeleton'
import { SettingsSkeleton } from './SettingsSkeleton'
import { InsightsSkeleton } from './InsightsSkeleton'
import { TipsSkeleton } from './TipsSkeleton'
import { TrackerSkeleton } from './TrackerSkeleton'
import { DashboardSkeleton } from './DashboardSkeleton'

export function PageLoader() {
  const location = useLocation()
  const path = location.pathname

  if (path === '/calendar') {
    return <CalendarSkeleton />
  }

  if (path === '/ask') {
    return <ChatSkeleton />
  }

  if (path === '/settings') {
    return <SettingsSkeleton />
  }

  if (path === '/insights') {
    return <InsightsSkeleton />
  }

  if (path === '/wellness-tips' || path === '/tips') {
    return <TipsSkeleton />
  }

  if (path === '/tracker' || path === '/symptoms') {
    return <TrackerSkeleton />
  }

  if (path === '/education') {
    return <TipsSkeleton />
  }

  return <DashboardSkeleton />
}

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { userApi, userKeys } from '../services/userService'
import { logsApi } from '../services/logsService'
import { partnerApi } from '../services/partnerService'
import { isLoggedIn } from '../lib/auth-token'

export function useReactQuerySync() {
  const location = useLocation()
  const hydrate = useStore(state => state.hydrate)
  const isLocalOnly = useStore(state => state.settings.privacyStrictLocalOnly)
  const loggedIn = isLoggedIn()
  const shouldFetch = loggedIn && !isLocalOnly

  const { data: profile } = useQuery({
    queryKey: userKeys.profile,
    queryFn: () => userApi.getProfile(),
    enabled: shouldFetch,
    staleTime: 1000 * 60 * 5,
  })

  useEffect(() => {
    if (profile) {
      hydrate({ user: profile.user, settings: profile.settings, dashboard: profile.dashboard })
    }
  }, [profile, hydrate])

  const { data: logs } = useQuery({
    queryKey: ['symptomLogs'],
    queryFn: () => logsApi.getAll(),
    enabled: shouldFetch,
    staleTime: 1000 * 60 * 2,
  })

  useEffect(() => {
    if (logs) useStore.setState({ logs })
  }, [logs])

  const { data: monthInReview } = useQuery({
    queryKey: ['monthInReview'],
    queryFn: () => logsApi.getMonthInReview(),
    enabled: shouldFetch,
    staleTime: 1000 * 60 * 2,
  })

  useEffect(() => {
    if (monthInReview) useStore.setState({ monthInReview })
  }, [monthInReview])

  const onPartnerPage = location.pathname === '/dashboard' || location.pathname === '/sync'
  const { data: partnerStatus } = useQuery({
    queryKey: ['partnerStatus'],
    queryFn: () => partnerApi.getStatus(),
    enabled: shouldFetch,
    refetchInterval: onPartnerPage ? 10000 : false,
    staleTime: 1000 * 5,
  })

  useEffect(() => {
    if (partnerStatus) {
      useStore.setState({
        partnerStatus,
        completedActions: partnerStatus.support?.completedActions ?? [],
        supportStreak: partnerStatus.support?.supportStreak ?? 0,
        lastActionDate: partnerStatus.support?.lastActionDate ?? '',
      })
    }
  }, [partnerStatus])
}

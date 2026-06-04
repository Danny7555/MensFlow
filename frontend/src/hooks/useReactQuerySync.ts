import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useStore } from '../store/useStore'
import { userApi, userKeys } from '../services/userService'
import { logsApi } from '../services/logsService'
import { partnerApi } from '../services/partnerService'
import { isLoggedIn } from '../lib/auth-token'

export function useReactQuerySync() {
  const hydrate = useStore(state => state.hydrate)
  const isLocalOnly = useStore(state => state.settings.privacyStrictLocalOnly)
  const loggedIn = isLoggedIn()
  const shouldFetch = loggedIn && !isLocalOnly

  // 1. Profile Query (fetch user, settings, dashboard)
  const { data: profile } = useQuery({
    queryKey: userKeys.profile,
    queryFn: () => userApi.getProfile(),
    enabled: shouldFetch,
    staleTime: 1000 * 60 * 5, // 5 minutes cache stale
  })

  useEffect(() => {
    if (profile) {
      hydrate({
        user: profile.user,
        settings: profile.settings,
        dashboard: profile.dashboard,
      })
    }
  }, [profile, hydrate])

  // 2. Symptom Logs Query
  const { data: logs } = useQuery({
    queryKey: ['symptomLogs'],
    queryFn: () => logsApi.getAll(),
    enabled: shouldFetch,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })

  useEffect(() => {
    if (logs) {
      useStore.setState({ logs })
    }
  }, [logs])

  // 3. Month In Review Analytics Query
  const { data: monthInReview } = useQuery({
    queryKey: ['monthInReview'],
    queryFn: () => logsApi.getMonthInReview(),
    enabled: shouldFetch,
    staleTime: 1000 * 60 * 2,
  })

  useEffect(() => {
    if (monthInReview) {
      useStore.setState({ monthInReview })
    }
  }, [monthInReview])

  // 4. Partner Sync Status Query (polls every 10 seconds for real-time alerts)
  const { data: partnerStatus } = useQuery({
    queryKey: ['partnerStatus'],
    queryFn: () => partnerApi.getStatus(),
    enabled: shouldFetch,
    refetchInterval: 10000,
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

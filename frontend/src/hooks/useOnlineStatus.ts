import { useState, useEffect, useRef } from 'react'
import { queryClient } from '../lib/queryClient'

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [backendReachable, setBackendReachable] = useState(true)
  const failureWindowRef = useRef<number[]>([])

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    const cache = queryClient.getQueryCache()
    const unsubscribe = cache.subscribe((event) => {
      if (event.type === 'updated' && event.action.type === 'error') {
        const now = Date.now()
        const window = now - 30_000
        failureWindowRef.current = [...failureWindowRef.current.filter(t => t > window), now]
        const recentFailures = failureWindowRef.current.length
        setBackendReachable(recentFailures < 3)
      }
    })
    return unsubscribe
  }, [])

  const showBanner = !isOnline || !backendReachable

  return { isOnline, backendReachable, showBanner }
}

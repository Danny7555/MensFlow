import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './apiClient'

/**
 * Don't retry on client-side errors (auth, not-found, validation).
 * Only retry on 5xx / network failures.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError) {
    // Never retry these status codes — retrying won't help
    if ([401, 403, 404, 422].includes(error.status)) return false
  }
  return failureCount < 2
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 minutes
      gcTime:    1000 * 60 * 10,  // 10 minutes
      retry: shouldRetry,
      refetchOnWindowFocus: false,
      throwOnError: false,
    },
    mutations: {
      retry: false,
    },
  },
})

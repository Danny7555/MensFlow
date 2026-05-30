import { useEffect, useState, useCallback } from 'react'
import { WarningCircle, Plug, X } from '@phosphor-icons/react'
import { queryClient } from '../lib/queryClient'
import { ApiError } from '../lib/apiClient'

interface Toast {
  id: string
  title: string
  message: string
  variant: 'error' | 'warning'
}

const IGNORE_STATUSES = new Set([401, 403, 404])
const AUTO_DISMISS_MS = 5_000

function buildToast(error: unknown): Toast | null {
  // Don't surface auth/not-found errors — those are handled elsewhere
  if (error instanceof ApiError && IGNORE_STATUSES.has(error.status)) return null

  const message =
    error instanceof Error
      ? error.message
      : 'An unexpected error occurred'

  const variant: Toast['variant'] =
    error instanceof ApiError && error.status >= 500 ? 'warning' : 'error'

  return {
    id: crypto.randomUUID(),
    title: variant === 'warning' ? 'Server error' : 'Something went wrong',
    message,
    variant,
  }
}

export function QueryErrorToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((toast: Toast) => {
    setToasts(prev => [...prev.slice(-4), toast]) // cap at 5 toasts
    setTimeout(() => dismiss(toast.id), AUTO_DISMISS_MS)
  }, [dismiss])

  useEffect(() => {
    // Subscribe to React Query's global error event
    const cache = queryClient.getQueryCache()
    const unsubscribe = cache.subscribe(event => {
      if (event.type === 'updated' && event.action.type === 'error') {
        const toast = buildToast(event.action.error)
        if (toast) addToast(toast)
      }
    })
    return unsubscribe
  }, [addToast])

  if (toasts.length === 0) return null

  return (
    <div className="mf-toast-container" aria-live="polite" aria-label="Notifications">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`mf-toast mf-toast--${toast.variant}`}
          role="alert"
        >
          <span className="mf-toast-icon" aria-hidden="true">
            {toast.variant === 'error' ? <WarningCircle size={18} weight="bold" /> : <Plug size={18} weight="bold" />}
          </span>
          <div className="mf-toast-body">
            <p className="mf-toast-title">{toast.title}</p>
            <p className="mf-toast-message">{toast.message}</p>
          </div>
          <button
            className="mf-toast-dismiss"
            onClick={() => dismiss(toast.id)}
            aria-label="Dismiss notification"
          >
            <X size={16} weight="bold" />
          </button>
        </div>
      ))}
    </div>
  )
}

import { WifiSlash, Plug } from '@phosphor-icons/react'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

export function ConnectionBanner() {
  const { isOnline, backendReachable } = useOnlineStatus()

  if (isOnline && backendReachable) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-white animate-in slide-in-from-top-1 duration-300"
      style={{
        background: !isOnline
          ? 'linear-gradient(135deg, #f97316, #ef4444)'
          : 'linear-gradient(135deg, #f59e0b, #d97706)',
      }}
      role="alert"
    >
      {!isOnline ? (
        <>
          <WifiSlash size={16} weight="bold" />
          <span>You're offline. Some features may be unavailable.</span>
        </>
      ) : (
        <>
          <Plug size={16} weight="bold" />
          <span>Connection issues. Retrying automatically...</span>
        </>
      )}
    </div>
  )
}

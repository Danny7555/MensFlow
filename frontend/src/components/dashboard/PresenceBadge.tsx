import { useEffect, useState } from 'react'
import { WifiHigh, WifiSlash } from '@phosphor-icons/react'
import { useRelativeTime } from '../../hooks/useRelativeTime'

interface PresenceBadgeProps {
  lastActive: number | null | undefined
  partnerName?: string
}

/**
 * Shows whether a partner is online/active (active within the last 5 minutes),
 * recently active (within last 24 hours), or away (older than 24 hours or unknown).
 * Displays a relative time label like "Active 2 mins ago" or "Last seen 3 days ago".
 */
export function PresenceBadge({ lastActive }: PresenceBadgeProps) {
  const relativeTime = useRelativeTime(lastActive)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(interval)
  }, [])

  // Determine online status
  const isOnline = lastActive ? (now - lastActive) < 5 * 60 * 1000 : false
  const isRecentlyActive = lastActive ? (now - lastActive) < 24 * 60 * 60 * 1000 : false

  if (!lastActive) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <WifiSlash size={12} weight="bold" className="text-muted-foreground/60" />
        <span>No activity yet</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* Status dot */}
      <span className="relative flex size-2">
        <span className={`absolute inline-flex size-full rounded-full ${
          isOnline ? 'bg-emerald-500' : isRecentlyActive ? 'bg-amber-400' : 'bg-gray-400'
        }`} />
      </span>

      {/* Label */}
      <span className="text-[10px] font-medium text-muted-foreground">
        {isOnline ? (
          <span className="text-emerald-600 dark:text-emerald-400">
            Active {relativeTime}
          </span>
        ) : isRecentlyActive ? (
          <span className="text-amber-600 dark:text-amber-400">
            Active {relativeTime}
          </span>
        ) : (
          <span>
            Last seen {relativeTime}
          </span>
        )}
      </span>

      {isOnline && (
        <WifiHigh size={10} weight="bold" className="text-emerald-500 ml-0.5" />
      )}
    </div>
  )
}

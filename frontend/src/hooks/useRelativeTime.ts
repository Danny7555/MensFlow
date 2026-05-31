import { useEffect, useState } from 'react'

/**
 * Returns a human-readable relative time string like "1 min ago", "5 mins ago",
 * "2 hours ago", "3 days ago", etc.
 * Re-renders every 30 seconds to keep the string fresh.
 */
export function useRelativeTime(timestamp: number | null | undefined): string | null {
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    if (!timestamp) {
      setLabel(null)
      return
    }

    const compute = () => {
      const now = Date.now()
      const diff = now - timestamp

      if (diff < 0) {
        // Future timestamp — treat as "just now"
        setLabel('just now')
        return
      }

      const seconds = Math.floor(diff / 1000)
      const minutes = Math.floor(seconds / 60)
      const hours = Math.floor(minutes / 60)
      const days = Math.floor(hours / 24)
      const weeks = Math.floor(days / 7)

      if (seconds < 60) {
        setLabel('just now')
      } else if (minutes === 1) {
        setLabel('1 min ago')
      } else if (minutes < 60) {
        setLabel(`${minutes} mins ago`)
      } else if (hours === 1) {
        setLabel('1 hour ago')
      } else if (hours < 24) {
        setLabel(`${hours} hours ago`)
      } else if (days === 1) {
        setLabel('1 day ago')
      } else if (days < 7) {
        setLabel(`${days} days ago`)
      } else if (weeks === 1) {
        setLabel('1 week ago')
      } else {
        setLabel(`${weeks} weeks ago`)
      }
    }

    compute()
    const interval = setInterval(compute, 30_000)
    return () => clearInterval(interval)
  }, [timestamp])

  return label
}
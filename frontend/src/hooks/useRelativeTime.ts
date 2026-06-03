import { useEffect, useState } from 'react'

function formatRelativeTime(timestamp: number | null | undefined): string | null {
  if (!timestamp) return null

  const diff = Date.now() - timestamp
  if (diff < 0) return 'just now'

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)

  if (seconds < 60) return 'just now'
  if (minutes === 1) return '1 min ago'
  if (minutes < 60) return `${minutes} mins ago`
  if (hours === 1) return '1 hour ago'
  if (hours < 24) return `${hours} hours ago`
  if (days === 1) return '1 day ago'
  if (days < 7) return `${days} days ago`
  if (weeks === 1) return '1 week ago'
  return `${weeks} weeks ago`
}

/**
 * Returns a human-readable relative time string like "1 min ago", "5 mins ago",
 * "2 hours ago", "3 days ago", etc.
 * Re-renders every 30 seconds to keep the string fresh.
 */
export function useRelativeTime(timestamp: number | null | undefined): string | null {
  const [label, setLabel] = useState<string | null>(() => formatRelativeTime(timestamp))
  const [trackedTimestamp, setTrackedTimestamp] = useState(timestamp)

  if (trackedTimestamp !== timestamp) {
    setTrackedTimestamp(timestamp)
    setLabel(formatRelativeTime(timestamp))
  }

  useEffect(() => {
    if (!timestamp) return
    const compute = () => setLabel(formatRelativeTime(timestamp))
    const interval = setInterval(compute, 30_000)
    return () => clearInterval(interval)
  }, [timestamp])

  return label
}

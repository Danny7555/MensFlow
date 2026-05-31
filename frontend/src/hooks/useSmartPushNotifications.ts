import { useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'

// ─── Cycle helpers (mirrors cycleUtils.ts) ────────────────────────────────────

function computeCycleDay(startIso: string, cycleLen: number): number {
  const safeLen = Math.max(1, cycleLen || 28)
  const start = new Date(`${startIso}T12:00:00`)
  if (Number.isNaN(+start)) return 1
  const days = Math.floor((Date.now() - +start) / 86400000)
  const m = ((days % safeLen) + safeLen) % safeLen
  return m + 1
}

// ─── Push helper ──────────────────────────────────────────────────────────────

function sendBrowserPush(title: string, body: string, tag: string) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  try {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag, // prevents duplicate notifications with the same tag
      badge: '/favicon.ico',
    })
  } catch (e) {
    console.warn('[Push] Failed to send browser notification:', e)
  }
}

// ─── Dedup: only fire each tag once per session ───────────────────────────────

const firedTags = new Set<string>()

// ─── Main hook ────────────────────────────────────────────────────────────────

/**
 * Automatically sends browser push notifications based on the logged-in user's
 * real cycle data and symptom logs. Runs once per app session.
 *
 * Triggers:
 *  - Period in 1, 2, or 3 days
 *  - Ovulation window / ovulation day
 *  - No symptoms logged today (nudge)
 */
export function useSmartPushNotifications() {
  const { dashboard: ownDashboard, user, partnerStatus, settings, logs } = useStore()
  const hasRun = useRef(false)

  useEffect(() => {
    // Wait until user data is available
    if (!user) return
    // Only fire once per session
    if (hasRun.current) return
    // User must have push + cycle reminders enabled
    if (!settings.notificationsPush || !settings.notificationsCycleReminders) return
    // Must have browser permission
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return

    hasRun.current = true

    const isPartner = user.role === 'partner'

    let lastPeriodStart: string | undefined
    let cycleLen = 28
    let partnerName = 'your partner'

    if (isPartner && partnerStatus?.paired && partnerStatus.cycle?.lastPeriodStart) {
      lastPeriodStart = partnerStatus.cycle.lastPeriodStart
      cycleLen = partnerStatus.cycle.typicalCycleDays || 28
      partnerName = partnerStatus.partner?.name || 'your partner'
    } else if (!isPartner && ownDashboard?.lastPeriodStart) {
      lastPeriodStart = ownDashboard.lastPeriodStart
      cycleLen = ownDashboard.typicalCycleDays || 28
    }

    if (!lastPeriodStart) return

    const cycleDay = computeCycleDay(lastPeriodStart, cycleLen)
    const daysLeft = Math.max(0, cycleLen - cycleDay)
    const ovDay = Math.max(10, cycleLen - 14)
    const fertileStart = ovDay - 4
    const fertileEnd = ovDay + 2

    // ── Period approaching ────────────────────────────────────────────────────
    if (daysLeft <= 3 && daysLeft > 0) {
      const tag = `period-soon-${daysLeft}`
      if (!firedTags.has(tag)) {
        firedTags.add(tag)
        setTimeout(() => {
          if (isPartner) {
            sendBrowserPush(
              `📅 Her period is in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
              `${partnerName}'s next period is approaching. Day ${cycleDay} of ${cycleLen}. Prepare comfort essentials.`,
              tag
            )
          } else {
            sendBrowserPush(
              `📅 Your period is ${daysLeft === 1 ? 'tomorrow!' : `in ${daysLeft} days`}`,
              `You're on Cycle Day ${cycleDay} of ${cycleLen}. Stock up on supplies and prioritise rest.`,
              tag
            )
          }
        }, 3000) // slight delay so app feels settled before popping
      }
    }

    // ── Ovulation / Fertile window ────────────────────────────────────────────
    if (cycleDay >= fertileStart && cycleDay <= fertileEnd) {
      const atPeak = cycleDay === ovDay
      const tag = atPeak ? 'ovulation-day' : `fertile-window-day-${cycleDay}`
      if (!firedTags.has(tag)) {
        firedTags.add(tag)
        setTimeout(() => {
          if (isPartner) {
            sendBrowserPush(
              atPeak ? `✨ Her ovulation day` : `🌸 She is in her fertile window`,
              atPeak
                ? `Today is ${partnerName}'s predicted ovulation day (Day ${cycleDay}). High energy and confidence expected!`
                : `${partnerName} is in her fertile window (Day ${cycleDay} of ${cycleLen}). Estrogen is peaking.`,
              tag
            )
          } else {
            sendBrowserPush(
              atPeak ? `✨ Today is your ovulation day!` : `🌸 You are in your fertile window`,
              atPeak
                ? `Day ${cycleDay}: Estrogen is at its peak. Expect high energy, confidence, and social drive.`
                : `Day ${cycleDay} of ${cycleLen}: You're in your fertile window. Great time for exercise and creativity.`,
              tag
            )
          }
        }, 5000)
      }
    }

    // ── Daily log nudge (ladies only) ─────────────────────────────────────────
    if (!isPartner) {
      const todayStr = new Date().toLocaleDateString('en-CA')
      const todayLog = logs.find(l => l.date === todayStr)
      const hasLoggedToday = todayLog && todayLog.symptoms.length > 0

      if (!hasLoggedToday) {
        const tag = `daily-log-nudge-${todayStr}`
        if (!firedTags.has(tag)) {
          firedTags.add(tag)
          setTimeout(() => {
            sendBrowserPush(
              `📝 Log your symptoms today`,
              `You haven't logged any symptoms for today (Cycle Day ${cycleDay}). Tracking keeps your predictions accurate.`,
              tag
            )
          }, 8000)
        }
      }
    }
  }, [user, ownDashboard, partnerStatus, settings, logs])
}

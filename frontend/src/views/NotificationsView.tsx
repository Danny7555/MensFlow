import { useMemo, useState } from 'react'
import { Bell, CaretLeft, CheckCircle, Info, WarningCircle, EnvelopeSimple } from "@phosphor-icons/react"
import { useNavigate } from "react-router-dom"
import { format } from "date-fns"
import { useStore } from "../store/useStore"
import { useAuth } from "../context/useAuth"
import { computeCycleDay } from "../lib/cycleUtils"
import { sendEmailReminder } from "../lib/emailService"

interface Notification {
  id: string
  title: string
  message: string
  time: Date
  type: 'info' | 'success' | 'warning'
  read: boolean
}

export function NotificationsView() {
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const { dashboard: data, settings, logs, supportStreak } = useStore()
  const [sendingId, setSendingId] = useState<string | null>(null)

  const notifications = useMemo(() => {
    const list: Notification[] = []
    const today = new Date()
    const todayStr = format(today, 'yyyy-MM-dd')

    // 1. Setup Reminders / Cycle Reminders
    if (!data.lastPeriodStart) {
      list.push({
        id: 'setup-cycle',
        title: "Setup Cycle Prediction",
        message: "Unlock personalized predictions, wellness reminders, and health tips by setting your partner's last cycle start date.",
        time: new Date(new Date().setHours(9, 0, 0, 0)),
        type: 'info',
        read: false
      })
    } else if (settings.notificationsCycleReminders) {
      const cycleDay = computeCycleDay(data.lastPeriodStart, data.typicalCycleDays)
      
      if (cycleDay >= 24) {
        list.push({
          id: 'cycle-warning-luteal',
          title: "Period starting soon",
          message: "Predictive logs show your partner is approaching her Menstrual phase. Get ready to offer comfort and warm support.",
          time: new Date(new Date().setHours(8, 30, 0, 0)),
          type: 'warning',
          read: false
        })
      } else if (cycleDay >= 11 && cycleDay <= 15) {
        list.push({
          id: 'cycle-info-ovulation',
          title: "Ovulation window active",
          message: "Your partner is in her peak fertility window. Social battery and communication capacity are high!",
          time: new Date(new Date().setHours(10, 0, 0, 0)),
          type: 'success',
          read: false
        })
      } else if (cycleDay >= 1 && cycleDay <= 5) {
        list.push({
          id: 'cycle-warning-menstruation',
          title: "Menstrual phase tracking",
          message: "Rest and recovery phase is active. Help with household chores, prepare warm beverages, and allow plenty of rest.",
          time: new Date(new Date().setHours(8, 0, 0, 0)),
          type: 'warning',
          read: false
        })
      } else {
        list.push({
          id: 'cycle-info-follicular',
          title: "Follicular phase focus",
          message: "Your partner is in her Follicular phase. Energy levels are rising, ideal for cooperative planning.",
          time: new Date(new Date().setHours(9, 0, 0, 0)),
          type: 'info',
          read: false
        })
      }
    }

    // 2. Daily Log Reminder
    const todayLogged = logs.some(l => l.date === todayStr)
    if (!todayLogged && settings.notificationsCycleReminders) {
      list.push({
        id: 'log-remainder',
        title: "Daily check-in alert",
        message: "No symptoms or flow levels have been logged for today yet. Take a moment to log body signals to maintain prediction accuracy.",
        time: new Date(new Date().setHours(18, 0, 0, 0)),
        type: 'info',
        read: false
      })
    }

    // 3. Support Streak Reminder
    if (supportStreak > 0 && settings.notificationsProduct) {
      list.push({
        id: 'streak-remainder',
        title: "Amazing support streak!",
        message: `You have successfully maintained your partner support streak for ${supportStreak} ${supportStreak === 1 ? 'day' : 'days'}! Keep up the outstanding efforts.`,
        time: new Date(new Date().setHours(12, 15, 0, 0)),
        type: 'success',
        read: false
      })
    }

    // Sort by time descending
    return list.sort((a, b) => b.time.getTime() - a.time.getTime())
  }, [data.lastPeriodStart, data.typicalCycleDays, settings.notificationsCycleReminders, settings.notificationsProduct, logs, supportStreak])

  const handleEmailReminder = async (notif: Notification) => {
    const emailTo = authUser?.username || 'user@example.com'
    const nameTo = authUser?.name || 'Partner'
    setSendingId(notif.id)
    try {
      await sendEmailReminder(emailTo, nameTo, notif.title, notif.message)
    } finally {
      setSendingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--mf-main-bg)] pb-20">
      <header className="sticky top-0 z-10 bg-[var(--mf-main-bg)]/80 backdrop-blur-xl border-b border-border/50 px-6 py-4 flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="size-10 flex items-center justify-center rounded-full bg-muted/50 hover:bg-muted transition-colors"
        >
          <CaretLeft size={20} weight="bold" />
        </button>
        <h1 className="text-xl font-semibold tracking-tight">Notifications & Alerts</h1>
      </header>

      <main className="max-w-2xl mx-auto mt-8 px-6">
        <div className="flex flex-col gap-4">
          {notifications.map(notification => (
            <div 
              key={notification.id}
              className={`p-5 rounded-2xl border transition-all ${
                notification.read 
                  ? 'bg-card/30 border-border/40 opacity-70' 
                  : 'bg-card border-[var(--mf-accent-border)] shadow-sm'
              }`}
            >
              <div className="flex gap-4 items-start">
                <div className={`size-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  notification.type === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                  notification.type === 'warning' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' :
                  'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400'
                }`}>
                  {notification.type === 'success' && <CheckCircle size={22} weight="fill" />}
                  {notification.type === 'warning' && <WarningCircle size={22} weight="fill" />}
                  {notification.type === 'info' && <Info size={22} weight="fill" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-[var(--mf-text-strong)]">{notification.title}</h3>
                    <span className="text-[10px] text-muted-foreground uppercase font-medium">
                      {format(notification.time, 'HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed pr-2">
                    {notification.message}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleEmailReminder(notification)}
                    disabled={sendingId !== null}
                    className="size-8 rounded-full border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                    title="Send as email reminder"
                  >
                    {sendingId === notification.id ? (
                      <div className="size-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                    ) : (
                      <EnvelopeSimple size={16} />
                    )}
                  </button>

                  {!notification.read && (
                    <div className="size-2 rounded-full bg-[var(--mf-accent)] mt-1" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 opacity-40">
            <Bell size={48} weight="light" className="mb-4" />
            <p>No notifications yet</p>
          </div>
        )}
      </main>
    </div>
  )
}

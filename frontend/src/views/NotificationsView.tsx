import { useMemo, useState, useEffect} from 'react'
import { Bell, CaretLeft, CheckCircle, Info, WarningCircle, EnvelopeSimple, Flame, Sliders, Eye } from "@phosphor-icons/react"
import { useNavigate } from "react-router-dom"
import { format } from "date-fns"
import { useStore } from "../store/useStore"
import { useAuth } from "../context/useAuth"
import { computeCycleDay } from "../lib/cycleUtils"
import { sendEmailReminder } from "../lib/emailService"
import { toast } from "sonner"

function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    
    const playNote = (frequency: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      
      osc.type = 'sine'
      osc.frequency.setValueAtTime(frequency, startTime)
      
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(0.12, startTime + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      osc.start(startTime)
      osc.stop(startTime + duration)
    }
    
    const now = ctx.currentTime
    playNote(523.25, now, 0.3)
    playNote(659.25, now + 0.12, 0.4)
  } catch (e) {
    console.error("Web Audio failed to play:", e)
  }
}

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
  const { dashboard: data, settings, logs, supportStreak, partnerStatus, updateSettings, user } = useStore()
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  
  const [alertPermission, setAlertPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  )

  const [isProcessing, setIsProcessing] = useState(false)
  const [guestRequest, setGuestRequest] = useState(
    localStorage.getItem('mensflow_guest_pending_access_request') === 'true'
  )

  useEffect(() => {
    const handleStorageChange = () => {
      setGuestRequest(localStorage.getItem('mensflow_guest_pending_access_request') === 'true')
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const isPendingRequest = user?.role === 'lady' && (
    settings.privacyPendingAccessRequest || guestRequest
  )

  const handleApproveRequest = async () => {
    setIsProcessing(true)
    try {
      if (guestRequest) {
        localStorage.removeItem('mensflow_guest_pending_access_request')
        setGuestRequest(false)
        window.dispatchEvent(new Event('storage'))
        await updateSettings({ privacyShareCycleDetails: true })
      } else {
        await updateSettings({ privacyShareCycleDetails: true, privacyPendingAccessRequest: false })
      }
      toast.success("Access granted! Your partner can now view detailed cycle metrics.")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to approve request.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeclineRequest = async () => {
    setIsProcessing(true)
    try {
      if (guestRequest) {
        localStorage.removeItem('mensflow_guest_pending_access_request')
        setGuestRequest(false)
        window.dispatchEvent(new Event('storage'))
      } else {
        await updateSettings({ privacyPendingAccessRequest: false })
      }
      toast.success("Access request declined.")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to decline request.")
    } finally {
      setIsProcessing(false)
    }
  }

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') {
      toast.error("Push notifications are not supported in this browser.")
      return
    }
    
    try {
      const permission = await Notification.requestPermission()
      setAlertPermission(permission)
      if (permission === 'granted') {
        toast.success("Push notifications enabled!", {
          description: "You will now receive alerts for cycle updates and wellness reminders."
        })
        playNotificationSound()
        new Notification("MensFlow Alerts Enabled", {
          body: "Notifications and chime sounds are now active!",
          icon: "/favicon.ico"
        })
      } else if (permission === 'denied') {
        toast.error("Notification permission denied", {
          description: "Please enable notifications for MensFlow in your browser settings."
        })
      }
    } catch (err) {
      console.error(err)
    }
  }

  const triggerTestNotification = () => {
    playNotificationSound()
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification("MensFlow Test Alert", {
        body: "Hello! Your cycle alerts and sound effects are working perfectly.",
        icon: "/favicon.ico"
      })
    } else {
      toast.success("Chime sound played!", {
        description: "Enable browser notification permission to get visual popups."
      })
    }
  }

  const notifications = useMemo(() => {
    const list: Notification[] = []
    const today = new Date()
    const todayStr = format(today, 'yyyy-MM-dd')
    const isPartner = user?.role === 'partner'

    if (isPartner) {
      // ─── PARTNER NOTIFICATIONS ───
      if (!partnerStatus || !partnerStatus.paired) {
        list.push({
          id: 'pair-partner',
          title: "Pair with your partner",
          message: "Sync with your partner to see her cycle phase, symptoms, and receive daily checklists to support her.",
          time: new Date(new Date().setHours(9, 0, 0, 0)),
          type: 'info',
          read: false
        })
      } else if (!partnerStatus.cycle || !partnerStatus.cycle.lastPeriodStart) {
        list.push({
          id: 'awaiting-setup',
          title: "Awaiting partner setup",
          message: "Your partner needs to configure her cycle start date before predictions and supportive tips can be generated.",
          time: new Date(new Date().setHours(9, 0, 0, 0)),
          type: 'info',
          read: false
        })
      } else if (settings.notificationsCycleReminders) {
        const pCycle = partnerStatus.cycle
        const cycleDay = computeCycleDay(pCycle.lastPeriodStart, pCycle.typicalCycleDays)
        const partnerName = partnerStatus.partner?.name || "your partner"

        if (cycleDay >= 24) {
          list.push({
            id: 'cycle-warning-luteal',
            title: "Period starting soon",
            message: `Predictive logs show ${partnerName} is approaching her Menstrual phase. Get ready to offer comfort and warm support.`,
            time: new Date(new Date().setHours(8, 30, 0, 0)),
            type: 'warning',
            read: false
          })
        } else if (cycleDay >= 11 && cycleDay <= 15) {
          list.push({
            id: 'cycle-info-ovulation',
            title: "Ovulation window active",
            message: `${partnerName} is in her peak fertility window. Social battery and communication capacity are high!`,
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
            message: `${partnerName} is in her Follicular phase. Energy levels are rising, ideal for cooperative planning.`,
            time: new Date(new Date().setHours(9, 0, 0, 0)),
            type: 'info',
            read: false
          })
        }

        // Daily reminder to support/check on partner
        const hasPartnerLoggedToday = pCycle.symptoms && pCycle.symptoms.length > 0
        if (!hasPartnerLoggedToday) {
          list.push({
            id: 'partner-log-nudge',
            title: "Supportive check-in reminder",
            message: `${partnerName} hasn't logged her symptoms for today yet. Ask how she is feeling to maintain accurate cycle insights.`,
            time: new Date(new Date().setHours(18, 0, 0, 0)),
            type: 'info',
            read: false
          })
        }
      }

      // Support Streak Reminder (partner only)
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
    } else {
      // ─── LADY NOTIFICATIONS ───
      if (!data.lastPeriodStart) {
        list.push({
          id: 'setup-cycle',
          title: "Setup Cycle Prediction",
          message: "Unlock personalized predictions, wellness reminders, and health tips by setting your last period start date.",
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
            message: "Predictive logs show you are approaching your Menstrual phase. Get ready to prioritize rest and wellness.",
            time: new Date(new Date().setHours(8, 30, 0, 0)),
            type: 'warning',
            read: false
          })
        } else if (cycleDay >= 11 && cycleDay <= 15) {
          list.push({
            id: 'cycle-info-ovulation',
            title: "Ovulation window active",
            message: "You are in your peak fertility window. Energy levels and social battery are high!",
            time: new Date(new Date().setHours(10, 0, 0, 0)),
            type: 'success',
            read: false
          })
        } else if (cycleDay >= 1 && cycleDay <= 5) {
          list.push({
            id: 'cycle-warning-menstruation',
            title: "Menstrual phase tracking",
            message: "Your Menstrual phase is active. Focus on rest, recovery, and gentle movement.",
            time: new Date(new Date().setHours(8, 0, 0, 0)),
            type: 'warning',
            read: false
          })
        } else {
          list.push({
            id: 'cycle-info-follicular',
            title: "Follicular phase focus",
            message: "You are in your Follicular phase. Energy levels are rising, ideal for starting new projects.",
            time: new Date(new Date().setHours(9, 0, 0, 0)),
            type: 'info',
            read: false
          })
        }
      }

      // Daily Log Reminder
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
    }

    // Sort by time descending
    return list.sort((a, b) => b.time.getTime() - a.time.getTime())
  }, [data.lastPeriodStart, data.typicalCycleDays, settings.notificationsCycleReminders, settings.notificationsProduct, logs, supportStreak, user?.role, partnerStatus])

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

  const cycleInfo = useMemo(() => {
    if (user?.role === 'partner') {
      return {
        phaseLabel: partnerStatus?.cycle?.phaseLabel ?? 'Luteal',
        lastPeriodStart: partnerStatus?.cycle?.lastPeriodStart ?? '',
        typicalCycleDays: partnerStatus?.cycle?.typicalCycleDays ?? 28,
        symptoms: partnerStatus?.cycle?.symptoms ?? [],
      }
    } else {
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      const todayLog = logs.find(l => l.date === todayStr)
      return {
        phaseLabel: data.phaseLabel ?? 'Luteal',
        lastPeriodStart: data.lastPeriodStart ?? '',
        typicalCycleDays: data.typicalCycleDays ?? 28,
        symptoms: todayLog?.symptoms ?? [],
      }
    }
  }, [user?.role, partnerStatus, data, logs])

  const cycleDay = useMemo(() => {
    if (!cycleInfo.lastPeriodStart) return 1
    return computeCycleDay(cycleInfo.lastPeriodStart, cycleInfo.typicalCycleDays)
  }, [cycleInfo])

  return (
    <div className="min-h-screen bg-background pb-bottom-nav">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-[var(--mf-border)]/50 px-6 py-4 flex items-center gap-4">
        <button type="button" 
          onClick={() => navigate(-1)}
          className="size-10 flex items-center justify-center rounded-full bg-[var(--mf-hover)] hover:bg-[var(--mf-active)] text-[var(--mf-text-strong)] transition-all active-squish cursor-pointer"
        >
          <CaretLeft size={20} weight="bold" />
        </button>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--mf-text-strong)]">Notifications & Alerts</h1>
      </header>

      <main className="max-w-6xl mx-auto mt-8 px-4 sm:px-6">
        {/* Full-width access request banner */}
        {isPendingRequest && (
          <div className="mb-8 p-6 rounded-[24px] border-2 border-pink-500/30 bg-pink-500/5 backdrop-blur-md flex flex-col md:flex-row gap-4 justify-between items-start md:items-center animate-in fade-in slide-in-from-top-3 duration-300">
            <div className="flex gap-4 items-start">
              <div className="size-12 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center shrink-0">
                <Bell size={24} weight="fill" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[var(--mf-text-strong)] mb-1">
                  Detailed Cycle Access Requested
                </h3>
                <p className="text-xs md:text-sm text-[var(--mf-muted)] leading-relaxed max-w-xl">
                  {partnerStatus?.partner?.name || 'Your partner'} is requesting permission to view your cycle metrics, logs, and analytics. Do you want to share your detailed data?
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 self-stretch md:self-auto justify-end">
              <button type="button"
                onClick={handleDeclineRequest}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--mf-hover)] hover:bg-[var(--mf-active)] text-[var(--mf-text-strong)] transition-all cursor-pointer disabled:opacity-50 active-squish"
              >
                Decline
              </button>
              <button type="button"
                onClick={handleApproveRequest}
                disabled={isProcessing}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-pink-500 hover:bg-pink-600 text-white shadow-lg shadow-pink-500/20 hover:shadow-pink-500/35 transition-all cursor-pointer disabled:opacity-50 active-squish"
              >
                Approve & Share
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Notification list — 7/12 on desktop */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs uppercase font-semibold text-[var(--mf-muted)] tracking-wider">
                Notification History
              </span>
              <div className="flex items-center gap-2">
                {notifications.some(n => !readIds.has(n.id)) && (
                  <button
                    type="button"
                    onClick={() => setReadIds(new Set(notifications.map(n => n.id)))}
                    className="text-[10px] font-semibold text-[var(--mf-accent)] hover:text-[var(--mf-accent-hover)] bg-[var(--mf-accent)]/8 hover:bg-[var(--mf-accent)]/15 px-2.5 py-1 rounded-full transition-all cursor-pointer active-squish flex items-center gap-1"
                  >
                    <Eye size={12} weight="bold" />
                    <span>Mark all read</span>
                  </button>
                )}
                {notifications.length > 0 && (
                  <span className="text-xs text-[var(--mf-accent)] font-semibold bg-[var(--mf-accent)]/8 px-2.5 py-1 rounded-full">
                    {notifications.filter(n => !readIds.has(n.id)).length} unread
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {notifications.map((notification, idx) => (
                <div 
                  key={notification.id}
                  onClick={() => setReadIds(prev => { const next = new Set(prev); next.add(notification.id); return next })}
                  className={`group p-5 rounded-[24px] border transition-all animate-in fade-in slide-in-from-bottom-3 duration-300 cursor-pointer ${
                    readIds.has(notification.id) 
                      ? 'bg-[var(--mf-card)]/50 border-[var(--mf-border)] opacity-60' 
                      : 'bg-[var(--mf-card)] border-[var(--mf-border-strong)] hover:border-[var(--mf-border)] hover:shadow-sm'
                  }`}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="flex gap-4 items-start">
                    <div className={`size-11 rounded-full flex items-center justify-center shrink-0 ${
                      notification.type === 'success' ? 'bg-[var(--mf-success-soft)] text-[var(--mf-success)]' :
                      notification.type === 'warning' ? 'bg-[var(--mf-danger-soft)] text-[var(--mf-danger)]' :
                      'bg-[var(--mf-info-soft)] text-[var(--mf-info)]'
                    }`}>
                      {notification.type === 'success' && <CheckCircle size={24} weight="fill" />}
                      {notification.type === 'warning' && <WarningCircle size={24} weight="fill" />}
                      {notification.type === 'info' && <Info size={24} weight="fill" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <h3 className="font-semibold text-[var(--mf-text-strong)] text-sm md:text-base leading-snug flex-1">
                          {notification.title}
                        </h3>
                        <span className="text-[10px] text-[var(--mf-muted)] uppercase font-semibold tracking-wider shrink-0 hidden sm:inline">
                          {format(notification.time, 'HH:mm')}
                        </span>
                      </div>
                      <p className="text-xs md:text-sm text-[var(--mf-muted)] leading-relaxed">
                        {notification.message}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 self-center">
                      <button type="button"
                        onClick={() => handleEmailReminder(notification)}
                        disabled={sendingId !== null}
                        className="size-9 rounded-full border border-[var(--mf-border)] bg-[var(--mf-card)] hover:bg-[var(--mf-hover)] hover:border-[var(--mf-border-strong)] text-[var(--mf-muted)] hover:text-[var(--mf-text-strong)] flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 active-squish"
                        title="Send as email reminder"
                      >
                        {sendingId === notification.id ? (
                          <div className="size-4 border-2 border-[var(--mf-muted)]/30 border-t-[var(--mf-muted)] rounded-full animate-spin" />
                        ) : (
                          <EnvelopeSimple size={18} />
                        )}
                      </button>

                      {!readIds.has(notification.id) && (
                        <div className="size-3 rounded-full bg-[var(--mf-accent)] shadow-[0_0_8px_var(--mf-accent)] shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {notifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="size-16 rounded-full bg-[var(--mf-hover)] flex items-center justify-center text-[var(--mf-muted)] mb-4">
                  <Bell size={32} weight="light" />
                </div>
                <h3 className="font-semibold text-[var(--mf-text-strong)] mb-1">All caught up</h3>
                <p className="text-xs md:text-sm text-[var(--mf-muted)] max-w-[280px] leading-relaxed">
                  You don't have any notifications or action alerts at the moment.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Widgets / Side Info Panel — 5/12 on desktop */}
          <div className="lg:col-span-5 flex flex-col gap-5 lg:sticky lg:top-24 h-fit">
            {/* Widget 1: Cycle Sync Card */}
            {((partnerStatus && partnerStatus.paired) || user?.role === 'lady') && (
              <div className="p-6 rounded-[24px] border border-[var(--mf-border)] bg-[var(--mf-card)]">
                <div className="flex items-center gap-2.5 mb-5">
                  <span className="size-2.5 rounded-full bg-pink-500 animate-pulse" />
                  <h3 className="font-semibold text-sm text-[var(--mf-text-strong)]">Cycle Sync Status</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-[var(--mf-border)]">
                    <span className="text-xs text-[var(--mf-muted)]">Active Phase</span>
                    <span className="text-xs font-semibold bg-pink-500/10 text-pink-500 px-2.5 py-1 rounded-full">
                      {cycleInfo.phaseLabel}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-[var(--mf-border)]">
                    <span className="text-xs text-[var(--mf-muted)]">Cycle Day</span>
                    <span className="text-xs font-semibold text-[var(--mf-text-strong)]">
                      Day {cycleDay} of {cycleInfo.typicalCycleDays}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[var(--mf-muted)]">Today's Symptoms</span>
                    <span className={`text-xs font-semibold ${cycleInfo.symptoms.length ? 'text-[var(--mf-text-strong)]' : 'text-[var(--mf-muted)]'}`}>
                      {cycleInfo.symptoms.length ? `${cycleInfo.symptoms.length} logged` : 'None'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Widget 2: Streak & Support */}
            {supportStreak > 0 && (
              <div className="p-6 rounded-[24px] border border-[var(--mf-border)] bg-[var(--mf-card)]">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="size-8 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center">
                    <Flame size={18} weight="fill" />
                  </div>
                  <h3 className="font-semibold text-sm text-[var(--mf-text-strong)]">Support Streak</h3>
                </div>
                <p className="text-xs text-[var(--mf-muted)] leading-relaxed mb-4">
                  Outstanding job! You are actively supporting partner wellness and maintaining sync.
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-pink-500 font-mono tracking-tight">
                    {supportStreak}
                  </span>
                  <span className="text-[10px] text-[var(--mf-muted)] font-semibold uppercase tracking-wider">
                    Days Active
                  </span>
                </div>
              </div>
            )}

            {/* Widget 3: Quick Alert Settings */}
            <div className="p-6 rounded-[24px] border border-[var(--mf-border)] bg-[var(--mf-card)]">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="size-8 rounded-full bg-[var(--mf-accent)]/10 text-[var(--mf-accent)] flex items-center justify-center">
                  <Sliders size={18} weight="fill" />
                </div>
                <h3 className="font-semibold text-sm text-[var(--mf-text-strong)]">Alert Preferences</h3>
              </div>
              
              {/* Toggle switches in a clean list */}
              <div className="space-y-1">
                {/* Email Reminders */}
                <div className="flex items-center justify-between py-2.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-[var(--mf-text-strong)]">Email Reminders</span>
                    <span className="text-[10px] text-[var(--mf-muted)]">Daily period & ovulation emails</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={settings.notificationsEmail}
                      onChange={(e) => {
                        updateSettings({ notificationsEmail: e.target.checked })
                        playNotificationSound()
                      }}
                    />
                    <div className="w-9 h-5 bg-[var(--mf-border-strong)] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[var(--mf-border-strong)] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--mf-accent)]"></div>
                  </label>
                </div>

                {/* Cycle Reminders */}
                <div className="flex items-center justify-between py-2.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-[var(--mf-text-strong)]">Cycle Reminders</span>
                    <span className="text-[10px] text-[var(--mf-muted)]">Phase alerts & tracking nudges</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={settings.notificationsCycleReminders}
                      onChange={(e) => {
                        updateSettings({ notificationsCycleReminders: e.target.checked })
                        playNotificationSound()
                      }}
                    />
                    <div className="w-9 h-5 bg-[var(--mf-border-strong)] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[var(--mf-border-strong)] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--mf-accent)]"></div>
                  </label>
                </div>

                {/* Product Alerts */}
                <div className="flex items-center justify-between py-2.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-[var(--mf-text-strong)]">Product Alerts</span>
                    <span className="text-[10px] text-[var(--mf-muted)]">Tips & streak milestone updates</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={settings.notificationsProduct}
                      onChange={(e) => {
                        updateSettings({ notificationsProduct: e.target.checked })
                        playNotificationSound()
                      }}
                    />
                    <div className="w-9 h-5 bg-[var(--mf-border-strong)] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[var(--mf-border-strong)] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--mf-accent)]"></div>
                  </label>
                </div>
              </div>

              {/* Browser Alert Permission — separated section */}
              <div className="mt-5 pt-4 border-t border-[var(--mf-border)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-[var(--mf-text-strong)]">Browser Push Alerts</span>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    alertPermission === 'granted' 
                      ? 'bg-green-500/10 text-green-500' 
                      : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {alertPermission === 'granted' ? 'Active' : 'Off'}
                  </span>
                </div>

                {alertPermission !== 'granted' ? (
                  <button type="button"
                    onClick={requestNotificationPermission}
                    className="w-full text-xs font-semibold bg-[var(--mf-accent)]/10 hover:bg-[var(--mf-accent)]/20 text-[var(--mf-accent)] border border-[var(--mf-accent)]/20 py-2.5 rounded-xl transition-all cursor-pointer text-center active-squish"
                  >
                    Enable Browser Alerts
                  </button>
                ) : (
                  <button type="button"
                    onClick={triggerTestNotification}
                    className="w-full text-xs font-semibold bg-[var(--mf-hover)] hover:bg-[var(--mf-active)] text-[var(--mf-text-strong)] border border-[var(--mf-border)] py-2.5 rounded-xl transition-all cursor-pointer text-center active-squish"
                  >
                    Test Push & Chime Sound
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

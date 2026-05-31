import { use, useReducer, useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Joyride, STATUS, type EventData, type TooltipRenderProps } from 'react-joyride'
import { m } from 'framer-motion'
import { Plus, LinkSimple, Users, ArrowRight, Sparkle, Check, Cookie, CookingPot, Heart, Moon, HandWaving, LockSimple, PersonIcon } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useStore } from '../store/useStore'
import { useAuth } from '../context/useAuth'
import { ChatSessionContext } from '../context/chat-session-context'
import { cn } from '../lib/utils'
import { partnerApi } from '../services/partnerService'
import { useDailyGuidance } from '../services/chatService'
import { computeCycleDay, getPhaseFromDay, getGreeting } from '../lib/cycleUtils'
import { CycleTrackerHero } from '../components/tracker/CycleTrackerHero'
import { LogSymptomsModal } from '../components/tracker/LogSymptomsModal'
import { SnapshotModal } from '../components/dashboard/SnapshotModal'
import { CustomizePlanModal } from '../components/dashboard/CustomizePlanModal'
import { DashboardSkeleton } from '../components/skeletons/DashboardSkeleton'

import { DashboardHeader } from '../components/dashboard/DashboardHeader'
import { StoriesSection } from '../components/dashboard/StoriesSection'
import { 
  PartnerTranslationCard, 
  QuickLogCard, 
  PrimaryInsightCard,
  BodySignalsCard,
  WellnessScoreCard,
  ConnectionChecklistCard
} from '../components/dashboard/FeedSection'
import { DailyTipCard } from '../components/dashboard/DailyTipCard'
import { HormoneInsightCard } from '../components/dashboard/HormoneInsightCard'
import { SymptomLogger } from '../components/dashboard/DailyCheckIn'

const getTimestamp = () => new Date().getTime()

interface QuickEmpathyBoostCardProps {
  ladyName: string
  isAuthenticated: boolean
}

function QuickEmpathyBoostCard({ ladyName, isAuthenticated }: QuickEmpathyBoostCardProps) {
  const [activePing, setActivePing] = useState<string | null>(null)
  
  const options = [
    { id: 'chocolate', label: 'Bring Chocolate', Icon: Cookie, color: "text-amber-600", message: "I'm on my way home with some sweet treats for you! " },
    { id: 'dinner', label: 'Cook Dinner', Icon: CookingPot, color: "text-orange-500", message: "Don't worry about dinner tonight, I've got it covered! " },
    { id: 'hug', label: 'Warm Hug', Icon: Heart, color: "text-rose-500", message: "Just wanted to send you a warm hug and remind you I'm here." },
    { id: 'space', label: 'Give Space', Icon: Moon, color: "text-indigo-400", message: "I'll make sure you have a quiet, peaceful space to rest today. " },
  ]

  const handleSendPing = async (id: string, label: string, message: string) => {
    setActivePing(id)
    try {
      if (isAuthenticated) {
        await partnerApi.sendPing(id, label, message)
      }
      
      const pingData = {
        id,
        label,
        message,
        timestamp: getTimestamp()
      }
      localStorage.setItem('mensflow_partner_ping:v1', JSON.stringify(pingData))
      window.dispatchEvent(new Event('storage'))
      
      toast.success(`Sent empathy boost to ${ladyName}!`, {
        description: `"${label}" nudge dispatched successfully.`
      })
    } catch (err) {
      console.error(err)
      toast.error("Failed to send empathy nudge")
    } finally {
      setTimeout(() => setActivePing(null), 1000)
    }
  }

  return (
    <div className="flo-card p-6 border-[var(--mf-border-strong)] bg-white dark:bg-[var(--mf-card)] text-left">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[9px] font-normal text-[var(--mf-accent)] uppercase tracking-[0.2em] block mb-0.5">Quick Actions</span>
          <h3 className="text-base font-normal text-[var(--mf-text-strong)] flex items-center gap-1.5">
            Send Empathy Boost <img src="/images/heart.png" alt="" className="size-4.5 object-contain inline-block ml-1" />
          </h3>
        </div>
      </div>
      <p className="text-[11px] text-[var(--mf-muted)] mb-5">
        Tap to send an instant real-time notification to her phone:
      </p>
      
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => {
          const isPending = activePing === opt.id
          return (
            <button
              key={opt.id}
              onClick={() => handleSendPing(opt.id, opt.label, opt.message)}
              disabled={activePing !== null}
              className="p-3 rounded-2xl bg-[var(--mf-hover)] hover:bg-[var(--mf-border)] text-left border border-[var(--mf-border)] flex flex-col justify-between h-[84px] transition-all cursor-pointer relative overflow-hidden group active-squish"
            >
              <div className="flex items-center justify-between w-full">
                {opt.Icon === Heart ? (
                  <img src="/images/heart.png" alt="" className="size-6 object-contain" />
                ) : (
                  <opt.Icon size={24} className={opt.color} weight="bold" />
                )}
                {isPending && (
                  <m.div 
                    animate={{ scale: [1, 1.2, 1] }} 
                    className="size-4 rounded-full bg-[var(--mf-accent)] flex items-center justify-center text-white"
                  >
                    <Check size={8} weight="bold" />
                  </m.div>
                )}
              </div>
              <span className="text-xs font-normal text-[var(--mf-text-strong)] group-hover:text-[var(--mf-accent)] transition-colors">
                {opt.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function AmbientBackground(_props: { phase: any; isPartner?: boolean }) {
  return null;
}

type DashboardState = {
  isSnapshotOpen: boolean
  isLogOpen: boolean
  isCustomizeOpen: boolean
  isEditingGuidance: boolean
  mounted: boolean
  now: Date | null
  isLoading: boolean
  tourRun: boolean
}

type DashboardAction = 
  | { type: 'TOGGLE_SNAPSHOT'; payload?: boolean }
  | { type: 'TOGGLE_LOG'; payload?: boolean }
  | { type: 'TOGGLE_CUSTOMIZE'; payload?: boolean }
  | { type: 'TOGGLE_GUIDANCE'; payload?: boolean }
  | { type: 'MOUNT'; payload: { now: Date; tourRun: boolean } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_TOUR_RUN'; payload: boolean }

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'TOGGLE_SNAPSHOT': return { ...state, isSnapshotOpen: action.payload ?? !state.isSnapshotOpen }
    case 'TOGGLE_LOG': return { ...state, isLogOpen: action.payload ?? !state.isLogOpen }
    case 'TOGGLE_CUSTOMIZE': return { ...state, isCustomizeOpen: action.payload ?? !state.isCustomizeOpen }
    case 'TOGGLE_GUIDANCE': return { ...state, isEditingGuidance: action.payload ?? !state.isEditingGuidance }
    case 'MOUNT': return { ...state, mounted: true, now: action.payload.now, tourRun: action.payload.tourRun }
    case 'SET_LOADING': return { ...state, isLoading: action.payload }
    case 'SET_TOUR_RUN': return { ...state, tourRun: action.payload }
    default: return state
  }
}

function TourTooltip({
  index,
  size,
  step,
  backProps,
  isLastStep,
  primaryProps,
  skipProps,
  tooltipProps,
}: TooltipRenderProps) {
  return (
    <div 
      {...tooltipProps} 
      className="bg-[var(--mf-card)] border border-[var(--mf-border)] shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] rounded-3xl p-5 max-w-[340px] w-[calc(100vw-32px)] text-left focus:outline-none relative z-50 animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--mf-accent)]">
          Tour • Step {index + 1} of {size}
        </span>
        {!isLastStep && (
          <button 
            {...skipProps} 
            type="button"
            className="text-[10px] font-semibold uppercase tracking-wider text-[var(--mf-muted)] hover:text-[var(--mf-text-strong)] transition-colors cursor-pointer"
          >
            Skip
          </button>
        )}
      </div>

      {step.title && (
        <h4 className="text-base font-semibold text-[var(--mf-text-strong)] mb-1">
          {step.title}
        </h4>
      )}

      <div className="text-xs text-[var(--mf-text)] leading-relaxed mb-5">
        {step.content}
      </div>

      <div className="flex items-center justify-between border-t border-[var(--mf-border)] pt-4">
        {/* Progress Dots */}
        <div className="flex gap-1.5">
          {Array.from({ length: size }).map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "size-1.5 rounded-full transition-all duration-300",
                i === index ? "bg-[var(--mf-accent)] w-3" : "bg-[var(--mf-muted)]/30"
              )}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          {index > 0 && (
            <button 
              {...backProps} 
              type="button"
              className="px-3.5 py-1.5 rounded-xl border border-[var(--mf-border)] text-xs font-medium text-[var(--mf-text-strong)] hover:bg-[var(--mf-hover)] transition-colors cursor-pointer active-squish"
            >
              Back
            </button>
          )}
          <button 
            {...primaryProps} 
            type="button"
            className="px-4 py-1.5 rounded-xl bg-[var(--mf-accent)] text-white text-xs font-semibold hover:brightness-105 transition-all cursor-pointer active-squish"
          >
            {isLastStep ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function DashboardView() {
  const { dashboard: ownDashboard, partnerStatus, fetchPartnerStatus, updateDashboard: update, isSaving, user, pairPartner, requestDetailedAccessAction, settings } = useStore()
  const { logout, isAuthenticated, openAuthModal } = useAuth()
  const { data: dailyGuidance } = useDailyGuidance()

  const [dashboardPartnerCodeInput, setDashboardPartnerCodeInput] = useState('')
  const [isDashboardPairing, setIsDashboardPairing] = useState(false)
  const [requestSent, setRequestSent] = useState(false)

  const handleRequestAccess = async () => {
    setRequestSent(true)
    await requestDetailedAccessAction()
  }

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleDashboardPair = async () => {
    if (!dashboardPartnerCodeInput.trim()) return
    setIsDashboardPairing(true)
    try {
      await pairPartner(dashboardPartnerCodeInput.trim())
      setDashboardPartnerCodeInput('')
    } finally {
      setIsDashboardPairing(false)
    }
  }

  const data = useMemo(() => {
    if (user?.role === 'partner' && partnerStatus?.paired && partnerStatus?.cycle) {
      return partnerStatus.cycle
    }
    return ownDashboard
  }, [user?.role, partnerStatus, ownDashboard])

  const aiTip = dailyGuidance?.dailyTip || (data.dailyTip && data.dailyTip.title ? data.dailyTip : undefined)
  const aiInsightText = dailyGuidance?.scientificInsight || data.scientificInsight

  const tourSteps = useMemo(() => {
    const isPartner = user?.role === 'partner'
    
    const steps = [
      {
        target: '.cycle-tracker-hero',
        title: isPartner ? "Partner's Cycle Tracker" : "Your Cycle Tracker",
        content: isPartner 
          ? "Keep track of your partner's current cycle day, phase, and upcoming period prediction." 
          : "See your current cycle day, active phase, and predictions of your next period at a glance.",
        placement: 'bottom' as const,
        disableBeacon: true,
      },
      {
        target: '.flo-story-circle',
        title: "Quick Navigation",
        content: "Tap these shortcuts to quickly navigate between the dashboard, logs, secret chats, and settings.",
        placement: 'bottom' as const,
        disableBeacon: true,
      },
      {
        target: '.flo-today-plan',
        title: "Daily Plan & Insights",
        content: "Explore daily phase-specific insights, hormone trends, and customized wellness recommendations.",
        placement: 'top' as const,
        disableBeacon: true,
      }
    ]

    if (isPartner) {
      steps.push({
        target: '.connection-checklist-card',
        title: "Daily Connection Gestures",
        content: "Check off customized support actions tailored to her active cycle phase to maintain your support streak.",
        placement: 'top' as const,
        disableBeacon: true,
      })
    } else {
      steps.push({
        target: isMobile ? '.flo-fab' : '.quick-log-card',
        title: "Instant Logging",
        content: isMobile 
          ? "Tap this floating action button at any time to record symptoms, mood, and flow data."
          : "Use this panel to quickly log your daily symptoms, mood, and lifestyle metrics.",
        placement: 'top' as const,
        disableBeacon: true,
      })
    }

    return steps
  }, [user?.role, isMobile])

  useEffect(() => {
    if (isAuthenticated && user?.role) {
      fetchPartnerStatus()
    }
  }, [isAuthenticated, user?.role, fetchPartnerStatus])

  const ctx = use(ChatSessionContext)
  const temporaryChat = ctx?.temporaryChat ?? false
  const setTemporaryChat = ctx?.setTemporaryChat ?? (() => {})
  const navigate = useNavigate()
  
  const [state, dispatch] = useReducer(dashboardReducer, {
    isSnapshotOpen: false,
    isLogOpen: false,
    isCustomizeOpen: false,
    isEditingGuidance: false,
    mounted: false,
    now: null,
    isLoading: isAuthenticated, // Only show skeleton for authenticated users loading their data
    tourRun: false
  })

  const [planSettings, setPlanSettings] = useState([
    { label: 'Hormone Trends', active: true },
    { label: 'Body Signals', active: true },
    { label: 'Wellness Score', active: true },
    { label: 'Supplement Guide', active: false },
    { label: 'Partner Insights', active: true },
  ])

  const startTour = () => {
    dispatch({ type: 'SET_TOUR_RUN', payload: true })
  }

  useEffect(() => {
    let active = true
    const mountTime = Date.now()

    const handlePingEvent = (e?: StorageEvent) => {
      if (e && e.key && e.key !== 'mensflow_partner_ping:v1') return
      try {
        const pingStr = localStorage.getItem('mensflow_partner_ping:v1')
        if (pingStr) {
          const ping = JSON.parse(pingStr)
          if (ping && ping.timestamp) {
            const lastProcessed = localStorage.getItem('mensflow_last_ping_processed:v1')
            if (lastProcessed !== String(ping.timestamp)) {
              localStorage.setItem('mensflow_last_ping_processed:v1', String(ping.timestamp))
              // Only toast if the message is fresh (sent after mount or within the last 15 seconds)
              if (ping.timestamp > mountTime - 15000) {
                toast.info(user?.role === 'lady' ? "Support Update received!" : "Partner Update received!", {
                  icon: <HandWaving size={16} weight="fill" className="text-amber-500" />,
                  description: user?.role === 'lady' ? `Partner says: "${ping.message}"` : `She is: "${ping.label}" (${ping.message})`,
                  duration: 8000,
                })
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to parse local storage ping", err)
      }
    }

    window.addEventListener('storage', handlePingEvent as EventListener)

    // Trigger check immediately in case storage is already set or on initial mount
    handlePingEvent()

    let interval: ReturnType<typeof setInterval> | null = null

    if (isAuthenticated) {
      const checkLatestPing = () => {
        partnerApi.getLatestPing()
          .then((ping) => {
            if (!active) return
            if (ping) {
              const lastProcessed = localStorage.getItem('mensflow_last_ping_processed:v1')
              if (lastProcessed !== String(ping.timestamp)) {
                localStorage.setItem('mensflow_last_ping_processed:v1', String(ping.timestamp))
                // Only toast if the message is fresh (sent after mount or within the last 15 seconds)
                if (ping.timestamp > mountTime - 15000) {
                  toast.info(user?.role === 'lady' ? "Support Update received!" : "Partner Update received!", {
                    icon: <HandWaving size={16} weight="fill" className="text-amber-500" />,
                    description: user?.role === 'lady' ? `Partner says: "${ping.message}"` : `She is: "${ping.label}" (${ping.message})`,
                    duration: 8000,
                  })
                }
              }
            }
          })
          .catch((e) => console.error("Failed to fetch latest partner ping", e))
      }

      checkLatestPing()
      interval = setInterval(checkLatestPing, 10000)
    }

    return () => {
      active = false
      window.removeEventListener('storage', handlePingEvent as EventListener)
      if (interval) clearInterval(interval)
    }
  }, [isAuthenticated, user?.role])

  useEffect(() => {
    const hasSeenTour = sessionStorage.getItem('mensflow_tour_completed')
    dispatch({
      type: 'MOUNT',
      payload: {
        now: new Date(),
        tourRun: !hasSeenTour && isAuthenticated,
      }
    })
    // Only show skeleton briefly for authenticated sessions loading real data
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        dispatch({ type: 'SET_LOADING', payload: false })
      }, 400)
      return () => clearTimeout(timer)
    } else {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleJoyrideCallback = (data: EventData) => {
    const { status } = data;
    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      sessionStorage.setItem('mensflow_tour_completed', 'true')
      dispatch({ type: 'SET_TOUR_RUN', payload: false })
    }
  }

  const phase = useMemo(() => {
    if (data.phaseLabel) {
      const normalized = data.phaseLabel.toLowerCase()
      if (normalized.includes('menstrual')) return 'menstrual'
      if (normalized.includes('follicular')) return 'follicular'
      if (normalized.includes('fertile') || normalized.includes('ovulat')) return 'fertile'
      if (normalized.includes('luteal')) return 'luteal'
    }
    const cycleDay = computeCycleDay(data.lastPeriodStart, data.typicalCycleDays)
    return getPhaseFromDay(cycleDay, data.typicalCycleDays)
  }, [data.lastPeriodStart, data.typicalCycleDays, data.phaseLabel])

  const currentDay = computeCycleDay(data.lastPeriodStart, data.typicalCycleDays)
  const showRestrictedView = user?.role === 'partner' && partnerStatus?.paired && partnerStatus?.privacyShareCycleDetails === false
  const [tipCompleted, setTipCompleted] = useState(false)

  const handleCopyGesture = (text: string, title: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied supportive gesture!", {
      description: `"${title}" template copied to clipboard.`,
      duration: 3000
    })
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const toggleTempChat = () => {
    const next = !temporaryChat
    setTemporaryChat(next)
    if (next) navigate('/ask')
  }

  if (state.isLoading) {
    return <DashboardSkeleton />
  }

  if (user?.role === 'partner' && (!partnerStatus || !partnerStatus.paired)) {
    return (
      <div className="dashboard-flo-theme relative overflow-hidden min-h-screen animate-in fade-in duration-700">
        <AmbientBackground phase="follicular" isPartner={true} />
        {!isAuthenticated && (
          <div className="bg-gradient-to-r from-[var(--mf-accent)] to-[#f472b6] text-white py-2.5 px-4 text-center text-xs font-normal flex items-center justify-center gap-2 relative z-50 animate-in slide-in-from-top duration-500">
            <span>You are previewing MensFlow as a guest. Your data is stored locally.</span>
            <button 
              type="button"
              onClick={() => openAuthModal()}
              className="bg-white text-[var(--mf-accent)] px-3 py-1 rounded-full text-[11px] font-normal hover:bg-opacity-95 transition-all active:scale-95 cursor-pointer ml-1"
            >
              Create account
            </button>
          </div>
        )}
        <DashboardHeader 
          user={user}
          mounted={state.mounted}
          isSaving={isSaving}
          getGreeting={getGreeting}
          temporaryChat={temporaryChat}
          toggleTempChat={toggleTempChat}
          handleLogout={handleLogout}
          onStartTour={startTour}
        />

        <main className="flo-main-container pb-32 px-4 md:px-0 relative z-10 flex items-center justify-center">
          <div className="flo-content-inner max-w-2xl w-full mx-auto">
            
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 md:p-10 rounded-[2.5rem] bg-[var(--mf-card)] border border-[var(--mf-border)] relative overflow-hidden"
            >
              <div className="flex flex-col items-center text-center gap-y-6">
                <div className="size-20 rounded-full bg-[var(--mf-accent)]/10 flex items-center justify-center text-[var(--mf-accent)] relative">
                  <Users size={36} className="text-[var(--mf-accent)]" />
                  <div className="absolute -right-1 -bottom-1 size-6 rounded-full bg-[var(--mf-accent)] flex items-center justify-center border-2 border-white dark:border-gray-900">
                    <LinkSimple size={12} weight="bold" className="text-white" />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-normal uppercase tracking-[0.2em] border border-[var(--mf-border)] text-[var(--mf-accent)] px-3 py-1 rounded-full inline-block">
                    Partner Program
                  </span>
                  <h1 className="text-2xl md:text-3xl font-normal tracking-tight text-[var(--mf-text-strong)]">
                    Connect to your partner
                  </h1>
                  <p className="text-xs text-[var(--mf-muted)] max-w-md mx-auto leading-relaxed">
                    Enter your partner's code to see her cycle status, read empathy translators, and get daily checklists to support her.
                  </p>
                </div>

                <div className="w-full max-w-sm space-y-4 pt-4">
                  <div className="space-y-2 text-left">
                    <label htmlFor="partner-code" className="text-[10px] font-normal uppercase tracking-wider text-muted-foreground block">
                      Enter Partner's Code
                    </label>
                    <div className="flex gap-3">
                      <input
                        id="partner-code"
                        type="text"
                        placeholder="e.g. XY82HA"
                        value={dashboardPartnerCodeInput}
                        onChange={(e) => setDashboardPartnerCodeInput(e.target.value.toUpperCase())}
                        className="flex-grow bg-white dark:bg-white/5 border border-[var(--mf-border)] rounded-2xl px-4 py-3 text-base font-mono tracking-widest text-center font-normal focus:outline-none focus:ring-2 focus:ring-[var(--mf-accent)]/50 uppercase text-[var(--mf-text-strong)] w-full"
                        maxLength={6}
                      />
                      <button
                        type="button"
                        disabled={isDashboardPairing || !dashboardPartnerCodeInput.trim()}
                        onClick={handleDashboardPair}
                        className="bg-[var(--mf-accent)] text-white hover:opacity-95 px-6 rounded-2xl text-xs font-normal flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-w-[100px] cursor-pointer"
                      >
                        {isDashboardPairing ? (
                          <m.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                            <Sparkle size={14} weight="bold" />
                          </m.div>
                        ) : (
                          <>
                            <span>Connect</span>
                            <ArrowRight size={14} weight="bold" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-[var(--mf-border)]"></div>
                    <span className="flex-shrink mx-4 text-[10px] text-muted-foreground uppercase tracking-widest">or share yours</span>
                    <div className="flex-grow border-t border-[var(--mf-border)]"></div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-[var(--mf-border)] flex items-center justify-between gap-4">
                    <div className="text-left">
                      <span className="text-[9px] font-normal uppercase tracking-wider text-muted-foreground block">Your Code</span>
                      <span className="text-sm font-mono font-normal tracking-wider text-[var(--mf-text-strong)]">
                        {user?.partnerCode ?? '------'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (user?.partnerCode) {
                          navigator.clipboard.writeText(user.partnerCode)
                          toast.success("Pairing code copied!", {
                            description: "Send this code to your partner so they can pair with you."
                          })
                        }
                      }}
                      className="text-[11px] font-normal bg-white dark:bg-white/10 hover:bg-gray-50 dark:hover:bg-white/15 text-[var(--mf-text-strong)] border border-[var(--mf-border)] px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground pt-4 flex items-center justify-center gap-1.5">
                  <LockSimple size={12} className="text-muted-foreground shrink-0" />
                  Connection is private. Your partner will only see shared empathy updates and checklists.
                </p>
              </div>
            </m.div>

          </div>
        </main>
      </div>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const joyrideProps: any = {
    steps: tourSteps,
    run: state.tourRun,
    continuous: true,
    showSkipButton: true,
    showProgress: true,
    disableOverlayClose: true,
    scrollToFirstStep: true,
    scrollOffset: 100,
    onEvent: handleJoyrideCallback,
    tooltipComponent: TourTooltip,
    styles: {
      options: {
        overlayColor: 'rgba(0, 0, 0, 0.6)',
        zIndex: 10000,
      },
      spotlight: {
        borderRadius: '24px',
        border: '2px dashed var(--mf-accent)',
        boxShadow: '0 0 15px var(--mf-accent)',
      }
    }
  }

  const ladyName = partnerStatus?.partner?.name || 'your partner'
  const isPartner = user?.role === 'partner'

  return (
    <div className="dashboard-flo-theme relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AmbientBackground phase={phase} isPartner={isPartner} />
      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-[var(--mf-accent)] to-[#f472b6] text-white py-2.5 px-4 text-center text-xs font-normal flex items-center justify-center gap-2 relative z-50 animate-in slide-in-from-top duration-500">
          <span>You are previewing MensFlow as a guest. Your data is stored locally.</span>
          <button 
            type="button"
            onClick={() => openAuthModal()}
            className="bg-white text-[var(--mf-accent)] px-3 py-1 rounded-full text-[11px] font-normal hover:bg-opacity-95 transition-all active:scale-95 cursor-pointer ml-1"
          >
            Create account
          </button>
        </div>
      )}
      {state.mounted && <Joyride {...joyrideProps} />}
      <DashboardHeader 
        user={user}
        mounted={state.mounted}
        isSaving={isSaving}
        getGreeting={getGreeting}
        temporaryChat={temporaryChat}
        toggleTempChat={toggleTempChat}
        handleLogout={handleLogout}
        onStartTour={startTour}
      />

      <main className="flo-main-container pb-32 px-4 md:px-0 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
        <div className="flo-content-inner">
          <div className="flo-dashboard-top mb-6 md:mb-8">
            {!settings.hideDailyStoriesAndTips && <StoriesSection />}
          </div>

          {/* Pairing Alert Banner */}
          {isAuthenticated && (!partnerStatus || !partnerStatus.paired) && (
            <div className="mb-6 p-4 rounded-2xl bg-[var(--mf-card)] border border-[var(--mf-border)] relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-[var(--mf-border)] text-[var(--mf-text-strong)] flex items-center justify-center shrink-0">
                    <LinkSimple size={16} weight="bold" />
                  </div>
                  <div className="space-y-0.5">
                    <h2 className="text-xs font-normal text-[var(--mf-text-strong)] flex items-center gap-1.5 text-left">
                      Sync with your partner
                      <span className="text-[8px] font-normal uppercase tracking-wider bg-[var(--mf-border)] text-[var(--mf-text-strong)] px-1.5 py-0.5 rounded">
                        Unpaired
                      </span>
                    </h2>
                    <p className="text-[11px] text-[var(--mf-muted)] text-left">
                      {isPartner
                        ? 'Connect to view cycle updates, wellness logs, and care options in real-time.'
                        : 'Connect to share your cycle phase, symptoms, and receive supportive tips.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/sync')}
                  className="text-xs font-normal bg-[var(--mf-accent)] text-white px-4 py-2 rounded-xl transition-all active:scale-95 shrink-0 w-full sm:w-auto text-center cursor-pointer"
                >
                  Pair Now
                </button>
              </div>
            </div>
          )}

          {/* Top Playbook Header Banner for Partner */}
          {isPartner && (
            <div className="mb-8 p-6 md:p-8 rounded-[2.5rem] bg-[var(--mf-card)] border border-[var(--mf-border)] relative overflow-hidden text-left">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2 text-left">
                  <h2 className="text-2xl font-normal tracking-tight text-[var(--mf-text-strong)]">
                    Partner Empathy Support Hub
                  </h2>
                  <p className="text-xs text-[var(--mf-muted)] max-w-xl leading-relaxed">
                    Welcome to your supportive workspace for {ladyName}. Today is her cycle Day {currentDay} in the {phase.charAt(0).toUpperCase() + phase.slice(1)} Phase. Use the checklist playbooks and translators below to coordinate active support.
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/40 dark:bg-white/5 border border-[var(--mf-border)] text-xs font-normal text-[var(--mf-text)] ">
                  <PersonIcon size={16} className="text-teal-500" />
                  <span>Connected to {ladyName}</span>
                </div>
              </div>
            </div>
          )}

          {isPartner ? (
            /* PARTNER PLAYBOOK LAYOUT */
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 md:gap-8 w-full min-w-0">
              {/* Left Column: Primary Empathy & Playbook Tools */}
              <div className="flex flex-col gap-6 md:gap-8 min-w-0">
                {!settings.hideDailyStoriesAndTips && (
                  <div className="w-full min-w-0">
                    <DailyTipCard
                      phaseLabel={phase}
                      tipCompleted={tipCompleted}
                      setTipCompleted={setTipCompleted}
                      aiTip={aiTip}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 min-w-0">
                  <ConnectionChecklistCard />
                  <PartnerTranslationCard 
                    label={phase}
                    onCopy={handleCopyGesture}
                  />
                </div>

                {!showRestrictedView && (
                  <div className="flex flex-col gap-6 md:gap-8 min-w-0 mt-2">
                    <div className="flex items-center gap-2 border-b border-[var(--mf-border)] pb-2">
                      <Sparkle size={18} className="text-teal-500" weight="fill" />
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--mf-text-strong)]">Her Cycle Insights</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 min-w-0">
                      <PrimaryInsightCard 
                        label={phase}
                        currentDay={currentDay}
                        trend={data.hormoneTrend}
                      />
                      <BodySignalsCard 
                        signals={data.bodySignals}
                        currentDay={currentDay}
                        phaseLabel={phase}
                      />
                    </div>
                    <div className="w-full min-w-0">
                      <HormoneInsightCard phaseLabel={phase} aiInsightText={aiInsightText} />
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Her Passive Status Reference & Real-Time Interaction */}
              <div className="flex flex-col gap-6 md:gap-8 min-w-0">
                {!showRestrictedView && (
                  <section className="flo-hero-panel min-w-0" aria-label="Cycle overview">
                    <CycleTrackerHero showCheckIn={false} data={data} />
                  </section>
                )}

                <div className="min-w-0">
                  <QuickEmpathyBoostCard ladyName={ladyName} isAuthenticated={isAuthenticated} />
                </div>

                <div className="min-w-0">
                  <WellnessScoreCard />
                </div>

                {showRestrictedView && (
                  <div className="p-5 sm:p-6 rounded-[2rem] bg-gradient-to-br from-teal-500/5 via-[var(--mf-composer-bg)] to-[var(--mf-composer-bg)] border border-[var(--mf-border)] text-center w-full space-y-4 flex flex-col items-center">
                    <div className="size-10 rounded-xl bg-teal-500/10 flex items-center justify-center mx-auto text-teal-500">
                      <Users size={20} weight="bold" />
                    </div>
                    <h3 className="text-xs font-semibold text-[var(--mf-text-strong)]">Detailed Metrics Kept Private</h3>
                    <p className="text-[11px] text-[var(--mf-muted)] leading-relaxed max-w-xs mx-auto">
                      {ladyName} has restricted sharing. The cycle status, hormone wave trends, and body signals are hidden.
                    </p>
                    <button
                      type="button"
                      onClick={handleRequestAccess}
                      disabled={requestSent}
                      className={cn(
                        "px-5 py-2 rounded-full text-[10px] font-normal transition-all mt-2",
                        requestSent 
                          ? "bg-emerald-500 text-white cursor-default animate-in fade-in" 
                          : "bg-[var(--mf-accent)] text-white hover:brightness-110 active-squish cursor-pointer border-0 outline-none"
                      )}
                    >
                      {requestSent ? "Access Request Sent ✔" : "Request Detailed Access"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* LADY TRACKING LAYOUT */
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 md:gap-8 w-full min-w-0">
              {/* Left Main Content */}
              <div className="flex flex-col gap-6 md:gap-8 min-w-0">
                <section className="flo-hero-panel min-w-0" aria-label="Cycle overview">
                  <CycleTrackerHero showCheckIn={true} data={data} />
                </section>

                <div className="flo-today-plan flex flex-col gap-6 md:gap-8 w-full min-w-0">
                  {!settings.hideDailyStoriesAndTips && (
                    <div className="w-full min-w-0">
                      <DailyTipCard
                        phaseLabel={phase}
                        tipCompleted={tipCompleted}
                        setTipCompleted={setTipCompleted}
                        aiTip={aiTip}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 min-w-0">
                    <PrimaryInsightCard 
                      label={phase}
                      currentDay={currentDay}
                      trend={data.hormoneTrend}
                    />
                    <BodySignalsCard 
                      signals={data.bodySignals}
                      currentDay={currentDay}
                      phaseLabel={phase}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:gap-8 min-w-0 md:grid-cols-1">
                    <HormoneInsightCard phaseLabel={phase} aiInsightText={aiInsightText} />
                  </div>
                </div>
              </div>

              {/* Right Sidebar Stack */}
              <div className="flex flex-col gap-6 md:gap-8 min-w-0">
                <div className="min-w-0">
                  <WellnessScoreCard />
                </div>

                <div className="min-w-0">
                  <QuickLogCard onViewAll={() => dispatch({ type: 'TOGGLE_LOG', payload: true })} />
                </div>

                <div className="flex-1 min-w-0">
                  <SymptomLogger />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Persistent Interaction Trigger */}
      {user?.role !== 'partner' && (
        <button 
          className="flo-fab"
          onClick={() => dispatch({ type: 'TOGGLE_LOG', payload: true })}
        >
          <div className="flo-fab-ripple" />
          <Plus size={28} weight="bold" />
        </button>
      )}

       <SnapshotModal 
        key={`snap-${state.isSnapshotOpen}`}
        isOpen={state.isSnapshotOpen}
        onOpenChange={(val) => dispatch({ type: 'TOGGLE_SNAPSHOT', payload: val })}
        data={data}
        update={update}
        isSaving={isSaving}
      />

      <CustomizePlanModal 
        key={`cust-${state.isCustomizeOpen}`}
        isOpen={state.isCustomizeOpen}
        onOpenChange={(val) => dispatch({ type: 'TOGGLE_CUSTOMIZE', payload: val })}
        planSettings={planSettings}
        setPlanSettings={setPlanSettings}
        isSaving={isSaving}
        onUpdate={async () => {
          await update({ 
            // Simulation of update
          })
          dispatch({ type: 'TOGGLE_CUSTOMIZE', payload: false })
        }}
      />

      {state.mounted && state.now && (
        <LogSymptomsModal 
          key={`log-${state.isLogOpen}-${computeCycleDay(data.lastPeriodStart, data.typicalCycleDays)}`}
          isOpen={state.isLogOpen} 
          onOpenChange={(val) => dispatch({ type: 'TOGGLE_LOG', payload: val })}
          activeDay={computeCycleDay(data.lastPeriodStart, data.typicalCycleDays)}
          activeDate={state.now}
        />
      )}
    </div>
  )
}

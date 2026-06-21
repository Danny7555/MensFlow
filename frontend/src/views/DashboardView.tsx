/* eslint-disable */
import { use, useReducer, useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { m } from 'framer-motion'
import { Plus, LinkSimple, Users, ArrowRight, Sparkle, Check, Cookie, CookingPot, Heart, Moon, LockSimple, FileText, Warning } from '@phosphor-icons/react'
import { DoctorReportModal } from '../components/dashboard/DoctorReportModal'
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
import { RequestAccessModal } from '../components/dashboard/RequestAccessModal'

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
import { MonthInReview } from '../components/dashboard/MonthInReview'
import { WeatherAlertCard } from '../components/dashboard/WeatherAlertCard'
import { hapticMedium, hapticHeavy } from '../lib/haptics'

const getTimestamp = () => new Date().getTime()

interface QuickEmpathyBoostCardProps {
  ladyName: string
  isAuthenticated: boolean
}

function QuickEmpathyBoostCard({ ladyName, isAuthenticated }: QuickEmpathyBoostCardProps) {
  const [activePing, setActivePing] = useState<string | null>(null)
  const { user } = useStore()
  const nav = useNavigate()
  
  const options = [
    { id: 'chocolate', label: 'Bring Chocolate', Icon: Cookie, color: "text-amber-600", message: "I'm on my way home with some sweet treats for you! " },
    { id: 'dinner', label: 'Cook Dinner', Icon: CookingPot, color: "text-orange-500", message: "Don't worry about dinner tonight, I've got it covered! " },
    { id: 'hug', label: 'Warm Hug', Icon: Heart, color: "text-rose-500", message: "Just wanted to send you a warm hug and remind you I'm here." },
    { id: 'space', label: 'Give Space', Icon: Moon, color: "text-indigo-400", message: "I'll make sure you have a quiet, peaceful space to rest today. " },
  ]

  const handleSendPing = async (id: string, label: string, message: string) => {
    hapticMedium()
    setActivePing(id)
    try {
      if (isAuthenticated) {
        await partnerApi.sendPing(id, label, message)
      }
      
      const pingData = {
        id,
        label,
        message,
        senderId: user?.id || 'guest',
        senderRole: user?.role || 'partner',
        timestamp: getTimestamp()
      }
      localStorage.setItem('mensflow_partner_ping:v1', JSON.stringify(pingData))
      window.dispatchEvent(new Event('storage'))
      
      toast.success(`Sent empathy boost to ${ladyName}!`, {
        description: `"${label}" nudge dispatched successfully.`,
        action: {
          label: 'Open Chat',
          onClick: () => nav('/sync'),
        },
      })
    } catch (err) {
      console.error(err)
      toast.error("Failed to send empathy nudge")
    } finally {
      setTimeout(() => setActivePing(null), 1000)
    }
  }

  return (
    <div className="flo-card p-6 text-left">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-[9px] font-normal text-[var(--mf-accent)] uppercase tracking-[0.2em] block mb-1">Quick Actions</span>
          <h3 className="text-base font-normal text-[var(--mf-text-strong)] flex items-center gap-2">
            Send Empathy Boost
            <m.span
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <img loading="lazy" src="/images/heart.png" alt="" className="size-4.5 object-contain inline-block" />
            </m.span>
          </h3>
        </div>
      </div>
      <p className="text-[11px] text-[var(--mf-muted)] mb-4 leading-relaxed">
        Tap to send an instant notification to her phone. Every small gesture counts.
      </p>
      
      <div className="grid grid-cols-2 gap-2.5">
        {options.map((opt) => {
          const isPending = activePing === opt.id
          return (
            <button type="button"
              key={opt.id}
              onClick={() => handleSendPing(opt.id, opt.label, opt.message)}
              disabled={activePing !== null}
              className="p-3 rounded-2xl bg-[var(--mf-hover)] hover:bg-[var(--mf-border)] text-left border border-[var(--mf-border)] flex flex-col justify-between h-[82px] transition-all cursor-pointer relative overflow-hidden group active-squish"
            >
              <div className="flex items-center justify-between w-full">
                {opt.Icon === Heart ? (
                  <img loading="lazy" src="/images/heart.png" alt="" className="size-5 object-contain" />
                ) : (
                  <opt.Icon size={20} className={opt.color} weight="bold" />
                )}
                {isPending && (
                  <m.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.3, 1] }} 
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

function AmbientBackground(_props: { phase: ReturnType<typeof getPhaseFromDay>; isPartner?: boolean }) {
  return null;
}

type DashboardState = {
  isSnapshotOpen: boolean
  isLogOpen: boolean
  isCustomizeOpen: boolean
  isEditingGuidance: boolean
  mounted: boolean
  now: Date | null
  tourRun: boolean
}

type DashboardAction = 
  | { type: 'TOGGLE_SNAPSHOT'; payload?: boolean }
  | { type: 'TOGGLE_LOG'; payload?: boolean }
  | { type: 'TOGGLE_CUSTOMIZE'; payload?: boolean }
  | { type: 'TOGGLE_GUIDANCE'; payload?: boolean }
  | { type: 'MOUNT'; payload: { now: Date; tourRun: boolean } }
  | { type: 'SET_TOUR_RUN'; payload: boolean }

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'TOGGLE_SNAPSHOT': return { ...state, isSnapshotOpen: action.payload ?? !state.isSnapshotOpen }
    case 'TOGGLE_LOG': return { ...state, isLogOpen: action.payload ?? !state.isLogOpen }
    case 'TOGGLE_CUSTOMIZE': return { ...state, isCustomizeOpen: action.payload ?? !state.isCustomizeOpen }
    case 'TOGGLE_GUIDANCE': return { ...state, isEditingGuidance: action.payload ?? !state.isEditingGuidance }
    case 'MOUNT': return { ...state, mounted: true, now: action.payload.now, tourRun: action.payload.tourRun }
    case 'SET_TOUR_RUN': return { ...state, tourRun: action.payload }
    default: return state
  }
}

function PartnerCareTipsCard({ phase, bodySignals, ladyName }: { phase: string; bodySignals: string; ladyName: string }) {
  const normalizedPhase = phase.toLowerCase()
  const symptoms = (bodySignals || '').toLowerCase()

  const tips = useMemo(() => {
    const list: string[] = []

    if (normalizedPhase.includes('menstru')) {
      list.push("Prepare iron-rich foods (spinach, red meat, lentils) to help her body replenish.")
      list.push("Suggest gentle activities like a slow walk, or simply watching a favorite movie together.")
      if (symptoms.includes('cramps') || symptoms.includes('pain')) {
        list.push("Prepare a hot water bottle or heating pad to soothe period cramps.")
        list.push("Offer a warm cup of red raspberry leaf or ginger tea.")
      }
    } else if (normalizedPhase.includes('follicul')) {
      list.push("Support her rising creativity and energy by planning a fun outdoor date or activity.")
      list.push("Encourage her to explore new projects—this is her peak planning phase.")
      if (symptoms.includes('fatigue') || symptoms.includes('tired')) {
        list.push("Even during energy peaks, transition fatigue can happen. Offer a morning coffee or healthy snack.")
      }
    } else if (normalizedPhase.includes('fertile') || normalizedPhase.includes('ovulat')) {
      list.push("Schedule a special date night or social event; her social energy is at its biological peak.")
      list.push("Leave a sweet post-it note or small surprise gesture to match her heightened openness and mood.")
    } else {
      // Luteal
      list.push("Prioritize a calm, stress-free home environment; reduce planning heavy or stressful debates.")
      list.push("Bring home some dark chocolate or her favorite comfort snack to satisfy luteal cravings.")
      if (symptoms.includes('fatigue') || symptoms.includes('sleep') || symptoms.includes('tired')) {
        list.push("Take over dinner prep or household chores to let her get extra rest.")
      }
      if (symptoms.includes('bloat') || symptoms.includes('tender')) {
        list.push("Suggest a warm bath with Epsom salts to help reduce physical bloating and water retention.")
      }
    }

    if (list.length < 3) {
      list.push(`Ask ${ladyName} how she is feeling today and actively listen without immediately trying to solve problems.`)
      list.push(`Take care of small daily chores (dishes, trash) to reduce her mental load.`)
    }

    return list.slice(0, 3)
  }, [normalizedPhase, symptoms, ladyName])

  return (
    <div className="flo-card p-6 text-left space-y-4">
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-lg bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] flex items-center justify-center">
          <Sparkle size={18} weight="fill" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-[var(--mf-text-strong)]">Daily Support Digest</h4>
          <p className="text-[10px] text-muted-foreground">Actionable care tips tailored to her state today</p>
        </div>
      </div>

      <div className="space-y-3 pt-1">
        {tips.map((tip, idx) => (
          <div key={idx} className="flex items-start gap-2.5 text-xs text-[var(--mf-text)] leading-relaxed">
            <span className="size-1.5 rounded-full bg-[var(--mf-accent)] mt-2 shrink-0" />
            <span>{tip}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

import { useSEO } from '../hooks/useSEO'

export function DashboardView() {
  useSEO({
    title: 'Dashboard',
    description: 'Your daily cycle overview: track symptoms, view hormone updates, and access supportive partner checklists.',
    keywords: 'cycle dashboard, daily cycle status, tracking home, partner notifications'
  })
  const { dashboard: ownDashboard, partnerStatus, fetchPartnerStatus, updateDashboard: update, isSaving, user, pairPartner, requestDetailedAccessAction, settings, notificationCount } = useStore()
  const { logout, isAuthenticated, openAuthModal } = useAuth()
  const { data: dailyGuidance } = useDailyGuidance()

  const [dashboardPartnerCodeInput, setDashboardPartnerCodeInput] = useState('')
  const [isDashboardPairing, setIsDashboardPairing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [requestSent, setRequestSent] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)

  const handleOpenModal = () => setShowModal(true)

  const handleConfirmRequest = async (selectedFields: string[]) => {
    setShowModal(false)
    setRequestSent(true)
    await requestDetailedAccessAction(selectedFields)
    await fetchPartnerStatus()
  }

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleDashboardPair = async () => {
    hapticMedium()
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

  // Tour steps definition and instantiation of driver.js is managed in a useEffect below

  useEffect(() => {
    if (isAuthenticated && user?.role && partnerStatus === null) {
      fetchPartnerStatus()
    }
  }, [isAuthenticated, user?.role, partnerStatus, fetchPartnerStatus])

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
    const handlePingReceived = (e: Event) => {
      const customEvent = e as CustomEvent
      const ping = customEvent.detail
      const isAccessPing = (pingId?: string) => Boolean(pingId?.startsWith('access-'))
      if (ping && isAccessPing(ping.pingId)) {
        setRequestSent(false)
      }
    }
    window.addEventListener('mensflow_ping_received', handlePingReceived)
    return () => {
      window.removeEventListener('mensflow_ping_received', handlePingReceived)
    }
  }, [])

  useEffect(() => {
    const hasSeenTour = sessionStorage.getItem('mensflow_tour_completed')
    dispatch({
      type: 'MOUNT',
      payload: {
        now: new Date(),
        tourRun: !hasSeenTour && isAuthenticated,
      }
    })
  }, [isAuthenticated])

  useEffect(() => {
    const isPartner = user?.role === 'partner'
    const isPairedPartner = isPartner && partnerStatus?.paired
    const isLady = user?.role === 'lady'
    const canRunTour = isLady || isPairedPartner

    if (state.mounted && state.tourRun && canRunTour) {
      const steps: any[] = []

      const addStepIfExist = (selector: string, stepConfig: any) => {
        if (document.querySelector(selector)) {
          steps.push({
            element: selector,
            popover: stepConfig
          })
        }
      }

      addStepIfExist('.cycle-tracker-hero', {
        title: isPartner ? "Partner's Cycle Tracker" : "Your Cycle Tracker",
        description: isPartner 
          ? "Keep track of your partner's current cycle day, phase, and upcoming period prediction." 
          : "See your current cycle day, active phase, and predictions of your next period at a glance.",
        side: 'bottom' as const,
        align: 'center' as const,
      })

      addStepIfExist('.flo-story-circle', {
        title: "Daily Stories",
        description: isPartner
          ? "Tap these shortcuts to read scientific insights and care tips customized for your partner's current day."
          : "Tap these shortcuts to read scientific insights, body signal guides, and care tips customized for your current day.",
        side: 'bottom' as const,
        align: 'center' as const,
      })

      addStepIfExist('.primary-insight-card', {
        title: "Phase Insights & Trends",
        description: isPartner
          ? "Explore what your partner is experiencing physically and hormonally during her current cycle phase."
          : "Explore how Estrogen, LH, and Progesterone behave during your current phase, and what they mean for your body.",
        side: 'top' as const,
        align: 'center' as const,
      })

      if (isPartner) {
        addStepIfExist('.partner-translation-card', {
          title: "Partner Empathy Translator",
          description: "Translate her cycle symptoms into supportive actions and copy supportive text templates to send her right away.",
          side: 'top' as const,
          align: 'center' as const,
        })
        addStepIfExist('.daily-tip-card', {
          title: "Daily Support Recommendation",
          description: "Get tailored daily recommendations on how to support her with foods, activities, and communication.",
          side: 'top' as const,
          align: 'center' as const,
        })
        addStepIfExist('.connection-checklist-card', {
          title: "Daily Connection Checklist",
          description: "Check off customized gestures (like making tea or taking over chores) to maintain your relationship streak.",
          side: 'top' as const,
          align: 'center' as const,
        })
        addStepIfExist('.body-signals-card', {
          title: "Shared Body Signals",
          description: "See which symptoms she has logged today so you can respond with care and empathy.",
          side: 'top' as const,
          align: 'center' as const,
        })
        addStepIfExist('.wellness-score-card', {
          title: "Partner Wellness Score",
          description: "Check your partner's calculated score based on her daily logged symptoms (if shared).",
          side: 'top' as const,
          align: 'center' as const,
        })
      } else {
        addStepIfExist('.daily-tip-card', {
          title: "Daily Tip & Action Card",
          description: "Get tailored daily recommendations for food, exercise, and mental well-being, and save or mark them as done.",
          side: 'top' as const,
          align: 'center' as const,
        })
        addStepIfExist('.body-signals-card', {
          title: "Body Signals & Focus",
          description: "See common symptoms for today and target specific wellness routines like hydration, stretching, or workouts.",
          side: 'top' as const,
          align: 'center' as const,
        })
        addStepIfExist('.wellness-score-card', {
          title: "Daily Wellness Score",
          description: "Track symptoms, mood, and sleep levels to calculate your daily wellness score and monitor health trends.",
          side: 'top' as const,
          align: 'center' as const,
        })
        addStepIfExist('.clinical-export-card', {
          title: "Clinical PDF Export",
          description: "Generate a print-ready PDF containing your historical averages, symptom trends, and biological NFP evidence to share with your doctor.",
          side: 'top' as const,
          align: 'center' as const,
        })
        addStepIfExist(isMobile ? '.flo-fab' : '.quick-log-card', {
          title: "Instant Logging",
          description: isMobile 
            ? "Tap this floating action button at any time to record symptoms, mood, and flow data."
            : "Use this panel to quickly log your daily symptoms, mood, and lifestyle metrics.",
          side: 'top' as const,
          align: 'center' as const,
        })
      }

      const timer = setTimeout(() => {
        // Ensure any previous driver is destroyed first
        const activeDriver = (window as any).__mensflow_driver
        if (activeDriver && typeof activeDriver.destroy === 'function') {
          activeDriver.destroy()
        }

        const driverObj = driver({
          showProgress: true,
          allowClose: true,
          overlayColor: 'rgba(0, 0, 0, 0.65)',
          steps,
          onDestroyed: () => {
            sessionStorage.setItem('mensflow_tour_completed', 'true')
            dispatch({ type: 'SET_TOUR_RUN', payload: false })
            delete (window as any).__mensflow_driver
          }
        })

        ;(window as any).__mensflow_driver = driverObj
        driverObj.drive()
      }, 300)

      return () => {
        clearTimeout(timer)
        const activeDriver = (window as any).__mensflow_driver
        if (activeDriver && typeof activeDriver.destroy === 'function') {
          activeDriver.destroy()
          delete (window as any).__mensflow_driver
        }
      }
    }
  }, [state.mounted, state.tourRun, user?.role, partnerStatus?.paired, isMobile])

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
  const trackingMode = settings.trackingMode
  
  const isPartner = user?.role === 'partner'
  const shareDetails = !isPartner || (partnerStatus?.paired && partnerStatus?.privacyShareCycleDetails !== false)
  const shareSymptoms = !isPartner || (partnerStatus?.paired && partnerStatus?.privacyShareSymptomLogs !== false)
  const shareCharts = !isPartner || (partnerStatus?.paired && partnerStatus?.privacyShareHealthCharts !== false)
  const showRequestAccessBox = isPartner && partnerStatus?.paired && (!shareDetails || !shareSymptoms || !shareCharts)
  const dashboardNotificationCount = notificationCount + (user?.role === 'lady' && settings.privacyPendingAccessRequest ? 1 : 0)
  const [tipCompleted, setTipCompleted] = useState(false)

  const handleCopyGesture = (text: string, title: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied supportive gesture!", {
      description: `"${title}" template copied to clipboard.`,
      duration: 5000,
      action: {
        label: 'Open Chat',
        onClick: () => navigate('/sync'),
      },
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

  // While partner status is still loading (null = API in-flight), show skeleton to avoid flash of unpaired screen
  if (isAuthenticated && !user?.role) {
    return <DashboardSkeleton />
  }

  if (user?.role === 'partner' && isAuthenticated && partnerStatus === null) {
    return <DashboardSkeleton />
  }

  if (user?.role === 'partner' && (!partnerStatus || !partnerStatus.paired)) {
    return (
      <div className="dashboard-flo-theme relative overflow-hidden min-h-screen animate-in fade-in duration-500">
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
          notificationCount={dashboardNotificationCount}
        />

        <main className="flo-main-container pb-24 md:pb-32 px-4 md:px-0 relative z-10 flex items-center justify-center">
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
        description: "Send this code to your partner so they can pair with you.",
        action: {
          label: 'Go to Sync',
          onClick: () => navigate('/sync'),
        },
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

  // Tour config is handled inside the driver.js useEffect hook

  const ladyName = partnerStatus?.partner?.name || 'your partner'


  return (
    <div className="dashboard-flo-theme relative overflow-hidden animate-in fade-in duration-500">
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
      {/* Tour overlay is managed via driver.js and rendered outside the react tree */}
      <DashboardHeader 
        user={user}
        mounted={state.mounted}
        isSaving={isSaving}
        getGreeting={getGreeting}
        temporaryChat={temporaryChat}
        toggleTempChat={toggleTempChat}
        handleLogout={handleLogout}
        onStartTour={startTour}
        notificationCount={dashboardNotificationCount}
      />

      <main className="flo-main-container pb-24 md:pb-32 px-4 md:px-0">
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

          {/* Top Playbook Header Banner for Partner — warm greeting, no cycle data (PhaseInsightCard handles education) */}
          {isPartner && (
            <div className="mb-8 partner-header-banner text-left">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2 text-left">
                  <h2 className="text-2xl font-normal tracking-tight text-[var(--mf-text-strong)] flex items-center gap-2">
                    <Heart size={24} className="text-[var(--mf-accent)]" weight="fill" />
                    Support {ladyName}
                  </h2>
                  <p className="text-xs text-[var(--mf-muted)] max-w-xl leading-relaxed">
                    Daily insights to help you understand what she's experiencing and how to be there for her.
                  </p>
                </div>
                <div className="partner-connection-badge shrink-0">
                  <span className="partner-connection-dot" />
                  <span>Connected to {ladyName}</span>
                </div>
              </div>
            </div>
          )}

          {isPartner ? (
            /* PARTNER DASHBOARD — educational-first, matching Flo for Partners approach.
               Primary focus: "What's she experiencing?" → "How can you help?"
               Cycle tracking data is secondary reference, not the focus. */
            <div className="dashboard-responsive-grid">
              {/* Left Column (Wide): Education → Support Actions */}
              <div className="flex flex-col gap-6 md:gap-8 min-w-0">
                {/* 1. Phase education — her current state, what it means (Flo's "quick-fire stories") */}
                {shareDetails && (
                  <PrimaryInsightCard 
                    label={phase}
                    currentDay={currentDay}
                    trend={data.hormoneTrend}
                  />
                )}

                {/* Private fallback if no phase data shared */}
                {!shareDetails && (
                  <div className="flo-card p-6 flex flex-col items-center justify-center text-center min-h-[200px]">
                    <LockSimple size={24} className="text-muted-foreground mb-3" />
                    <h4 className="text-sm font-semibold text-[var(--mf-text-strong)]">Cycle Details Private</h4>
                    <p className="text-[11px] text-muted-foreground mt-1 max-w-[280px] leading-relaxed">
                      Your partner is keeping her cycle details private. Once she shares them, you'll see daily insights here.
                    </p>
                  </div>
                )}

                {/* 2. Support translator — "how you can help" (Flo's "actions you can take right away") */}
                <PartnerTranslationCard 
                  label={phase}
                  onCopy={handleCopyGesture}
                />

                {shareSymptoms && (
                  <PartnerCareTipsCard 
                    phase={phase}
                    bodySignals={data.bodySignals}
                    ladyName={ladyName}
                  />
                )}

                {/* 3. Quick empathy actions (secondary to education) */}
                <QuickEmpathyBoostCard ladyName={ladyName} isAuthenticated={isAuthenticated} />

                {!settings.hideDailyStoriesAndTips && (
                  <DailyTipCard
                    phaseLabel={phase}
                    tipCompleted={tipCompleted}
                    setTipCompleted={setTipCompleted}
                    aiTip={aiTip}
                  />
                )}
              </div>

              {/* Right Column (Narrow): Reference widgets only — no cycle tracker visual */}
              <div className="flex flex-col gap-6 md:gap-8 min-w-0">
                <ConnectionChecklistCard />

                {shareSymptoms && (
                  <BodySignalsCard 
                    signals={data.bodySignals}
                    currentDay={currentDay}
                    phaseLabel={phase}
                  />
                )}

                {shareDetails && (
                  <HormoneInsightCard phaseLabel={phase} aiInsightText={aiInsightText} />
                )}

                {shareCharts ? (
                  <WellnessScoreCard />
                ) : (
                  <div className="flo-card p-6 flex flex-col items-center justify-center text-center min-h-[120px]">
                    <LockSimple size={20} className="text-muted-foreground mb-2" />
                    <h4 className="text-xs font-semibold text-[var(--mf-text-strong)]">Health Trends Private</h4>
                    <p className="text-[10px] text-muted-foreground mt-1 max-w-[220px]">Monthly reviews and analytics scores are private.</p>
                  </div>
                )}

                {showRequestAccessBox && (
                  <div className="p-5 sm:p-6 rounded-[2rem] bg-gradient-to-br from-teal-500/5 via-[var(--mf-composer-bg)] to-[var(--mf-composer-bg)] border border-[var(--mf-border)] text-center w-full space-y-4 flex flex-col items-center">
                    <div className="size-10 rounded-xl bg-teal-500/10 flex items-center justify-center mx-auto text-teal-500">
                      <Users size={20} weight="bold" />
                    </div>
                    <h3 className="text-xs font-semibold text-[var(--mf-text-strong)]">Request More Access</h3>
                    <p className="text-[11px] text-[var(--mf-muted)] leading-relaxed max-w-xs mx-auto">
                      Some details are hidden. Request additional access categories from your partner to support her better.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenModal}
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
            <div className="dashboard-responsive-grid">
              {/* Left Main Content */}
              <div className="flex flex-col gap-6 md:gap-8 min-w-0">
                <section className="flo-hero-panel min-w-0" aria-label="Cycle overview">
                  <CycleTrackerHero showCheckIn={true} data={data} />
                </section>

                {/* Mode-specific insight banner */}
                {trackingMode === 'conception' && (
                  <m.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500/8 via-rose-500/5 to-transparent border border-rose-500/25 text-[var(--mf-text-strong)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left"
                  >
                    <div className="flex-1 p-5 space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2 text-rose-600 dark:text-rose-400">
                        <Sparkle size={14} weight="fill" />
                        Conception Mode Active
                      </h4>
                      <p className="text-[12px] text-foreground leading-relaxed opacity-90 max-w-2xl">
                        Tracking fertile windows and NFP signs. Log BBT, cervical mucus, and LH levels daily for the most accurate fertile window predictions.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 px-5 pb-5 sm:pb-5 sm:pr-5 sm:pl-0">
                      <button
                        type="button"
                        onClick={() => navigate('/track')}
                        className="px-4 py-2.5 rounded-xl text-[11px] font-medium bg-rose-500 hover:bg-rose-600 text-white transition-all cursor-pointer text-center border-none active:scale-95"
                      >
                        View Tracker
                      </button>
                    </div>
                  </m.div>
                )}
                {trackingMode === 'pregnancy' && (
                  <m.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-500/8 via-purple-500/5 to-transparent border border-purple-500/25 text-[var(--mf-text-strong)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left"
                  >
                    <div className="flex-1 p-5 space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2 text-purple-600 dark:text-purple-400">
                        <Sparkle size={14} weight="fill" />
                        Pregnancy Mode Active
                      </h4>
                      <p className="text-[12px] text-foreground leading-relaxed opacity-90 max-w-2xl">
                        Period predictions paused. Log pregnancy symptoms, track weeks, and monitor your wellbeing.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 px-5 pb-5 sm:pb-5 sm:pr-5 sm:pl-0">
                      <button
                        type="button"
                        onClick={() => navigate('/track')}
                        className="px-4 py-2.5 rounded-xl text-[11px] font-medium bg-purple-500 hover:bg-purple-600 text-white transition-all cursor-pointer text-center border-none active:scale-95"
                      >
                        Log Symptoms
                      </button>
                    </div>
                  </m.div>
                )}
                {trackingMode === 'perimenopause' && (
                  <m.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/8 via-amber-500/5 to-transparent border border-amber-500/25 text-[var(--mf-text-strong)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left"
                  >
                    <div className="flex-1 p-5 space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <Sparkle size={14} weight="fill" />
                        Perimenopause Mode Active
                      </h4>
                      <p className="text-[12px] text-foreground leading-relaxed opacity-90 max-w-2xl">
                        Tracking irregular cycles, hot flashes, and mood shifts. Cycle predictions are adjusted for perimenopause variability.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 px-5 pb-5 sm:pb-5 sm:pr-5 sm:pl-0">
                      <button
                        type="button"
                        onClick={() => navigate('/track')}
                        className="px-4 py-2.5 rounded-xl text-[11px] font-medium bg-amber-500 hover:bg-amber-600 text-white transition-all cursor-pointer text-center border-none active:scale-95"
                      >
                        Log Symptoms
                      </button>
                    </div>
                  </m.div>
                )}

                {data.isAtypical && trackingMode !== 'pregnancy' && (
                  <m.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/8 via-amber-500/5 to-transparent border border-amber-500/25 text-[var(--mf-text-strong)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left"
                  >
                    <div className="flex-1 p-5 space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <Warning size={14} weight="fill" />
                        Irregular Cycle Warning
                      </h4>
                      <p className="text-[12px] text-foreground leading-relaxed opacity-90 max-w-2xl">
                        Your typical cycle length ({data.typicalCycleDays} days) or cycle variation ({data.cycleVariationDays} days) is atypical. This could be due to hormonal changes, stress, or underlying conditions like PCOS.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 px-5 pb-5 sm:pb-5 sm:pr-5 sm:pl-0">
                      <button
                        type="button"
                        onClick={() => setIsReportOpen(true)}
                        className="px-4 py-2.5 rounded-xl text-[11px] font-medium bg-white text-amber-700 border border-amber-200 hover:bg-amber-50 hover:border-amber-300 transition-all cursor-pointer text-center active:scale-95"
                      >
                        <FileText size={13} className="inline-block mr-1.5 -mt-0.5" />
                        Print Doctor Report
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/education?topic=Care')}
                        className="px-4 py-2.5 rounded-xl text-[11px] font-medium bg-amber-500 hover:bg-amber-600 text-white transition-all cursor-pointer text-center border-none active:scale-95"
                      >
                        Read Care Guides
                      </button>
                    </div>
                  </m.div>
                )}

                <div className="flo-today-plan flex flex-col gap-6 md:gap-8 w-full min-w-0">
                  {trackingMode !== 'pregnancy' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 min-w-0">
                      <MonthInReview />
                      <WeatherAlertCard />
                    </div>
                  )}
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
                    {trackingMode !== 'pregnancy' && (
                      <BodySignalsCard 
                        signals={data.bodySignals}
                        currentDay={currentDay}
                        phaseLabel={phase}
                      />
                    )}
                    {trackingMode === 'pregnancy' && (
                      <div className="flo-card p-6 flex flex-col items-center justify-center text-center border border-[var(--mf-border)] bg-[var(--mf-card)] min-h-[160px] rounded-3xl">
                        <Sparkle size={24} className="text-purple-500 mb-2" />
                        <h4 className="text-xs font-semibold text-[var(--mf-text-strong)]">Pregnancy Wellness</h4>
                        <p className="text-[10px] text-muted-foreground mt-1 max-w-[220px]">Track pregnancy symptoms, energy levels, and appointments in your daily log.</p>
                      </div>
                    )}
                  </div>

                  {trackingMode !== 'pregnancy' && (
                    <div className="grid grid-cols-1 gap-6 md:gap-8 min-w-0 md:grid-cols-1">
                      <HormoneInsightCard phaseLabel={phase} aiInsightText={aiInsightText} />
                    </div>
                  )}
                </div>
              </div>

              {/* Right Sidebar Stack */}
              <div className="flex flex-col gap-6 md:gap-8 min-w-0">
                <div className="flo-card flo-card--prominent clinical-export-card overflow-hidden text-left">
                  <div className="flo-card-top relative z-10">
                    <div className="flo-card-icon flo-card-icon--purple">
                      <FileText size={20} weight="light" />
                    </div>
                    <span className="flo-card-title">Clinical Export</span>
                  </div>
                  <div className="mt-2 relative z-10 flex flex-col flex-1 space-y-3">
                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold text-[var(--mf-text-strong)]">Share with your Doctor</h4>
                      <p className="text-[10px] text-foreground leading-relaxed">
                        Generate a print-ready PDF containing your historical averages, symptom trends, and biological NFP evidence to share with your healthcare provider.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsReportOpen(true)}
                      className="w-full py-2.5 rounded-xl text-[11px] font-semibold bg-[var(--mf-accent)] text-white hover:brightness-105 active:scale-95 transition-all text-center border-none cursor-pointer"
                    >
                      Generate Doctor Report
                    </button>
                  </div>
                </div>

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
        <button type="button" 
          className="flo-fab"
          onClick={() => { hapticHeavy(); dispatch({ type: 'TOGGLE_LOG', payload: true }); }}
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

      <RequestAccessModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirmRequest}
        isLoading={isSaving}
      />

      <DoctorReportModal 
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </div>
  )
}

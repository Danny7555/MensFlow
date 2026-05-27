/* eslint-disable react-hooks/set-state-in-effect */
import { use, useReducer, useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Joyride, STATUS } from 'react-joyride'
import { m } from 'framer-motion'
import { Plus } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useStore } from '../store/useStore'
import { useAuth } from '../context/useAuth'
import { ChatSessionContext } from '../context/chat-session-context'
import { cn } from '../lib/utils'
import { partnerApi } from '../lib/api'
import { computeCycleDay, getPhaseFromDay, getGreeting, type CyclePhase } from '../lib/cycleUtils'
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
  usePartnerTranslation,
  PrimaryInsightCard,
  BodySignalsCard,
  WellnessScoreCard,
  ConnectionChecklistCard
} from '../components/dashboard/FeedSection'
import { DailyTipCard } from '../components/dashboard/DailyTipCard'
import { HormoneInsightCard } from '../components/dashboard/HormoneInsightCard'
import { SymptomLogger } from '../components/dashboard/DailyCheckIn'

function AmbientBackground({ phase }: { phase: CyclePhase }) {
  return (
    <>
      <div 
        className={cn(
          "absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[150px] opacity-60 pointer-events-none transition-all duration-1000 ease-in-out bg-gradient-to-br z-0",
          phase === 'menstrual' && "from-red-500/20 to-transparent",
          phase === 'follicular' && "from-teal-500/20 to-transparent",
          phase === 'fertile' && "from-sky-500/20 to-transparent",
          phase === 'luteal' && "from-amber-500/20 to-transparent"
        )} 
      />
      <div 
        className={cn(
          "absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full blur-[150px] opacity-40 pointer-events-none transition-all duration-1000 ease-in-out bg-gradient-to-br z-0",
          phase === 'menstrual' && "from-rose-500/10 to-transparent",
          phase === 'follicular' && "from-emerald-500/10 to-transparent",
          phase === 'fertile' && "from-cyan-500/10 to-transparent",
          phase === 'luteal' && "from-yellow-500/10 to-transparent"
        )} 
      />
    </>
  )
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

const TOUR_STEPS = [
  {
    target: '.cycle-tracker-hero',
    content: "This is your partner's Cycle Tracker. See their current phase and predictions at a glance.",
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.flo-story-circle',
    content: "Tap these stories to quickly jump to insights, secret chats, or wellness tips.",
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.flo-feed-row .flo-card',
    content: "Today's Plan gives you phase-specific insights, body signals, and daily tips.",
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.flo-fab',
    content: "Use this to quickly log new symptoms or notes for the current day.",
    placement: 'top',
    disableBeacon: true,
  }
]

export function DashboardView() {
  const { dashboard: data, updateDashboard: update, isSaving, user } = useStore()
  const { logout, isAuthenticated, openAuthModal } = useAuth()
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
    isLoading: true,
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

    const checkLatestPing = () => {
      partnerApi.getLatestPing()
        .then((ping) => {
          if (!active) return
          if (ping) {
            const lastProcessed = localStorage.getItem('mensflow_last_ping_processed:v1')
            if (lastProcessed !== String(ping.timestamp)) {
              localStorage.setItem('mensflow_last_ping_processed:v1', String(ping.timestamp))
              toast.info("Partner Update received!", {
                icon: "👋",
                description: `She is: "${ping.label}" (${ping.message})`,
                duration: 8000,
              })
            }
          }
        })
        .catch((e) => console.error("Failed to fetch latest partner ping", e))
    }

    checkLatestPing()
    const interval = setInterval(checkLatestPing, 10000)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('mensflow_tour_completed')
    dispatch({
      type: 'MOUNT',
      payload: {
        now: new Date(),
        tourRun: !hasSeenTour
      }
    })
    const timer = setTimeout(() => {
      dispatch({ type: 'SET_LOADING', payload: false })
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      localStorage.setItem('mensflow_tour_completed', 'true')
      dispatch({ type: 'SET_TOUR_RUN', payload: false })
    }
  }

  const phase = useMemo(() => {
    const cycleDay = computeCycleDay(data.lastPeriodStart, data.typicalCycleDays)
    return getPhaseFromDay(cycleDay)
  }, [data.lastPeriodStart, data.typicalCycleDays])

  const partnerTranslation = usePartnerTranslation(phase)
  const currentDay = computeCycleDay(data.lastPeriodStart, data.typicalCycleDays)
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

  return (
    <div className="dashboard-flo-theme relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AmbientBackground phase={phase} />
      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-[var(--mf-accent)] to-[#f472b6] text-white py-2.5 px-4 text-center text-xs font-normal flex items-center justify-center gap-2 relative z-50 animate-in slide-in-from-top duration-500">
          <span>You are previewing MensFlow as a guest. Your data is stored locally.</span>
          <button 
            onClick={openAuthModal}
            className="bg-white text-[var(--mf-accent)] px-3 py-1 rounded-full text-[11px] font-normal hover:bg-opacity-95 transition-all active:scale-95 cursor-pointer ml-1"
          >
            Create account
          </button>
        </div>
      )}
      {state.mounted && (
        <Joyride
          {...{
            steps: TOUR_STEPS,
            run: state.tourRun,
            continuous: true,
            showSkipButton: true,
            showProgress: true,
            disableOverlayClose: true,
            scrollToFirstStep: true,
            scrollOffset: 100,
            onEvent: handleJoyrideCallback,
            locale: {
              back: 'Back',
              close: 'Close',
              last: 'Got it',
              next: 'Next',
              skip: 'Skip'
            },
            styles: {
              options: {
                arrowColor: 'var(--card)',
                backgroundColor: 'var(--card)',
                overlayColor: 'rgba(0, 0, 0, 0.45)',
                primaryColor: 'var(--mf-accent)',
                textColor: 'var(--mf-text-strong)',
                width: 290,
                zIndex: 10000,
              },
              tooltip: {
                borderRadius: '20px',
                border: '1px solid var(--mf-border)',
                padding: '20px',
                boxShadow: 'none',
              },
              tooltipContainer: {
                textAlign: 'left',
              },
              buttonNext: {
                borderRadius: '999px',
                backgroundColor: 'var(--mf-accent)',
                color: '#ffffff',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '600',
                border: 'none',
                outline: 'none',
              },
              buttonBack: {
                color: 'var(--mf-muted)',
                marginRight: '12px',
                fontSize: '12px',
                fontWeight: '500',
              },
              buttonSkip: {
                color: 'var(--mf-muted)',
                fontSize: '12px',
                fontWeight: '500',
              }
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any}
        />
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

      <main className="flo-main-container pb-32 px-4 md:px-0 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
        <div className="flo-content-inner">
          <div className="flo-dashboard-top mb-6 md:mb-8">
            <StoriesSection />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 md:gap-8 w-full min-w-0">
            {/* Left Main Content */}
            <div className="flex flex-col gap-6 md:gap-8 min-w-0">
              <section className="flo-hero-panel min-w-0" aria-label="Cycle overview">
                <CycleTrackerHero showCheckIn={true} />
              </section>

              <div className="w-full min-w-0">
                <DailyTipCard
                  tipCompleted={tipCompleted}
                  setTipCompleted={setTipCompleted}
                />
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
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 min-w-0">
                <HormoneInsightCard />
                <ConnectionChecklistCard />
              </div>
            </div>

            {/* Right Sidebar Stack */}
            <div className="flex flex-col gap-6 md:gap-8 min-w-0">
              <section aria-label="Partner support" className="min-w-0">
                <PartnerTranslationCard 
                  label={phase}
                  desc={partnerTranslation.desc}
                  tips={partnerTranslation.tips}
                  gestures={partnerTranslation.gestures}
                  onCopy={handleCopyGesture}
                />
              </section>

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
        </div>
      </main>

      {/* Persistent Interaction Trigger */}
      <m.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="flo-fab"
        onClick={() => dispatch({ type: 'TOGGLE_LOG', payload: true })}
      >
        <div className="flo-fab-ripple" />
        <Plus size={28} weight="bold" />
      </m.button>

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
          key={`log-${state.isLogOpen}`}
          isOpen={state.isLogOpen} 
          onOpenChange={(val) => dispatch({ type: 'TOGGLE_LOG', payload: val })}
          activeDay={computeCycleDay(data.lastPeriodStart, data.typicalCycleDays)}
          activeDate={state.now}
        />
      )}
    </div>
  )
}

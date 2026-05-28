/* eslint-disable react-hooks/set-state-in-effect */
import { use, useReducer, useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Joyride, STATUS } from 'react-joyride'
import { m } from 'framer-motion'
import { Plus, LinkSimple, Users, ArrowRight, Sparkle } from '@phosphor-icons/react'
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
  const { dashboard: ownDashboard, partnerStatus, fetchPartnerStatus, updateDashboard: update, isSaving, user, pairPartner } = useStore()

  const [dashboardPartnerCodeInput, setDashboardPartnerCodeInput] = useState('')
  const [isDashboardPairing, setIsDashboardPairing] = useState(false)

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

  useEffect(() => {
    if (user?.role) {
      fetchPartnerStatus()
    }
  }, [user?.role, fetchPartnerStatus])

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
            const lastProcessed = sessionStorage.getItem('mensflow_last_ping_processed:v1')
            if (lastProcessed !== String(ping.timestamp)) {
              sessionStorage.setItem('mensflow_last_ping_processed:v1', String(ping.timestamp))
              toast.info(user?.role === 'lady' ? "Support Update received!" : "Partner Update received!", {
                icon: "👋",
                description: user?.role === 'lady' ? `Partner says: "${ping.message}"` : `She is: "${ping.label}" (${ping.message})`,
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
    const hasSeenTour = sessionStorage.getItem('mensflow_tour_completed')
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
      sessionStorage.setItem('mensflow_tour_completed', 'true')
      dispatch({ type: 'SET_TOUR_RUN', payload: false })
    }
  }

  const phase = useMemo(() => {
    const cycleDay = computeCycleDay(data.lastPeriodStart, data.typicalCycleDays)
    return getPhaseFromDay(cycleDay)
  }, [data.lastPeriodStart, data.typicalCycleDays])

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

  if (user?.role === 'partner' && (!partnerStatus || !partnerStatus.paired)) {
    return (
      <div className="dashboard-flo-theme relative overflow-hidden min-h-screen animate-in fade-in duration-700">
        <AmbientBackground phase="follicular" />
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
              className="p-8 md:p-10 rounded-[2.5rem] bg-gradient-to-br from-pink-500/10 via-[var(--mf-composer-bg)] to-[var(--mf-composer-bg)] border border-[var(--mf-border)] backdrop-blur-lg relative overflow-hidden shadow-xl"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 left-10 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col items-center text-center space-y-6">
                <m.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="size-20 rounded-full bg-gradient-to-br from-pink-400 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/10 relative"
                >
                  <Users size={36} weight="duotone" className="text-white" />
                  <div className="absolute -right-1 -bottom-1 size-6 rounded-full bg-purple-500 flex items-center justify-center border-2 border-white dark:border-gray-900">
                    <LinkSimple size={12} weight="bold" className="text-white" />
                  </div>
                </m.div>

                <div className="space-y-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] bg-pink-500/10 text-pink-500 px-3 py-1 rounded-full border border-pink-500/20 inline-block">
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
                    <label htmlFor="partner-code" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                      Enter Partner's Code
                    </label>
                    <div className="flex gap-3">
                      <input
                        id="partner-code"
                        type="text"
                        placeholder="e.g. XY82HA"
                        value={dashboardPartnerCodeInput}
                        onChange={(e) => setDashboardPartnerCodeInput(e.target.value.toUpperCase())}
                        className="flex-grow bg-white dark:bg-white/5 border border-[var(--mf-border)] rounded-2xl px-4 py-3 text-base font-mono tracking-widest text-center font-bold focus:outline-none focus:ring-2 focus:ring-[var(--mf-accent)]/50 uppercase text-[var(--mf-text-strong)] w-full"
                        maxLength={6}
                      />
                      <m.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        disabled={isDashboardPairing || !dashboardPartnerCodeInput.trim()}
                        onClick={handleDashboardPair}
                        className="bg-[var(--mf-accent)] text-white hover:opacity-95 px-6 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-[var(--mf-accent)]/15 min-w-[100px] cursor-pointer"
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
                      </m.button>
                    </div>
                  </div>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-[var(--mf-border)]"></div>
                    <span className="flex-shrink mx-4 text-[10px] text-muted-foreground uppercase tracking-widest">or share yours</span>
                    <div className="flex-grow border-t border-[var(--mf-border)]"></div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-[var(--mf-border)] flex items-center justify-between gap-4">
                    <div className="text-left">
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block">Your Code</span>
                      <span className="text-sm font-mono font-bold tracking-wider text-[var(--mf-text-strong)]">
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
                      className="text-[11px] font-semibold bg-white dark:bg-white/10 hover:bg-gray-50 dark:hover:bg-white/15 text-[var(--mf-text-strong)] border border-[var(--mf-border)] px-3 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground pt-4">
                  🔒 Connection is private. Your partner will only see shared empathy updates and checklists.
                </p>
              </div>
            </m.div>

          </div>
        </main>
      </div>
    )
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

          {/* Pairing Alert Banner */}
          {isAuthenticated && (!partnerStatus || !partnerStatus.paired) && (
            <m.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-transparent border border-[var(--mf-border)] backdrop-blur-md relative overflow-hidden"
            >
              {/* Decorative glows */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center shrink-0">
                    <LinkSimple size={16} weight="bold" />
                  </div>
                  <div className="space-y-0.5">
                    <h2 className="text-xs font-semibold text-[var(--mf-text-strong)] flex items-center gap-1.5 text-left">
                      Sync with your partner
                      <span className="text-[8px] font-semibold uppercase tracking-wider bg-pink-500/10 text-pink-500 px-1.5 py-0.5 rounded">
                        Unpaired
                      </span>
                    </h2>
                    <p className="text-[11px] text-[var(--mf-muted)] text-left">
                      {user?.role === 'partner'
                        ? 'Connect to view cycle updates, wellness logs, and care options in real-time.'
                        : 'Connect to share your cycle phase, symptoms, and receive supportive tips.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/sync')}
                  className="text-xs font-semibold bg-[var(--mf-accent)] text-white hover:opacity-90 px-4 py-2 rounded-xl transition-all active:scale-95 shrink-0 w-full sm:w-auto text-center cursor-pointer shadow-sm shadow-[var(--mf-accent)]/10"
                >
                  Pair Now
                </button>
              </div>
            </m.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 md:gap-8 w-full min-w-0">
            {/* Left Main Content */}
            <div className="flex flex-col gap-6 md:gap-8 min-w-0">
              <section className="flo-hero-panel min-w-0" aria-label="Cycle overview">
                <CycleTrackerHero showCheckIn={user?.role !== 'partner'} />
              </section>

              <div className="w-full min-w-0">
                <DailyTipCard
                  phaseLabel={phase}
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
                  phaseLabel={phase}
                />
              </div>

              <div className={cn("grid grid-cols-1 gap-6 md:gap-8 min-w-0", user?.role === 'partner' ? "md:grid-cols-2" : "md:grid-cols-1")}>
                <HormoneInsightCard />
                {user?.role === 'partner' && <ConnectionChecklistCard />}
              </div>
            </div>

            {/* Right Sidebar Stack */}
            <div className="flex flex-col gap-6 md:gap-8 min-w-0">
              {user?.role === 'partner' && (
                <section aria-label="Partner support" className="min-w-0">
                  <PartnerTranslationCard 
                    label={phase}
                    onCopy={handleCopyGesture}
                  />
                </section>
              )}

              <div className="min-w-0">
                <WellnessScoreCard />
              </div>

              {user?.role !== 'partner' && (
                <>
                  <div className="min-w-0">
                    <QuickLogCard onViewAll={() => dispatch({ type: 'TOGGLE_LOG', payload: true })} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <SymptomLogger />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Persistent Interaction Trigger */}
      {user?.role !== 'partner' && (
        <m.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="flo-fab"
          onClick={() => dispatch({ type: 'TOGGLE_LOG', payload: true })}
        >
          <div className="flo-fab-ripple" />
          <Plus size={28} weight="bold" />
        </m.button>
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

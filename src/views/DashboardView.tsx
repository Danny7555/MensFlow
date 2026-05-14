<<<<<<< HEAD
/* eslint-disable react-hooks/set-state-in-effect */
import { use, useReducer, useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Joyride, type Step, STATUS } from 'react-joyride'
import { useStore } from '../store/useStore'
import { useAuth } from '../context/useAuth'
import { ChatSessionContext } from '../context/chat-session-context'
import { CycleTrackerHero } from '../components/tracker/CycleTrackerHero'
import { LogSymptomsModal } from '../components/tracker/LogSymptomsModal'
import { SnapshotModal } from '../components/dashboard/SnapshotModal'
import { CustomizePlanModal } from '../components/dashboard/CustomizePlanModal'

import { DashboardHeader } from '../components/dashboard/DashboardHeader'
import { StoriesSection } from '../components/dashboard/StoriesSection'
import { FeedSection } from '../components/dashboard/FeedSection'
=======
import { useEffect, useMemo, useState } from 'react'
import {
  CalendarBlank,
  ClipboardText,
  PencilSimple,
  Check,
  Calendar as CalendarIcon,
} from '@phosphor-icons/react'
import { format, parseISO } from 'date-fns'
import { Calendar } from '../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover'
import { Button } from '../components/ui/button'
import { cn } from '../lib/utils'
import { useDashboardData } from '../context/useDashboardData'
>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)

function computeCycleDay(startIso: string, cycleLen: number) {
  const start = new Date(`${startIso}T12:00:00`)
  if (Number.isNaN(+start)) return 1
  const days = Math.floor((Date.now() - +start) / 86400000)
  const m = ((days % cycleLen) + cycleLen) % cycleLen
  return m + 1
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
<<<<<<< HEAD
=======

export function DashboardView() {
  const { data, update, lastSaved } = useDashboardData()
  const [isEditingGuidance, setIsEditingGuidance] = useState(false)
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])
>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)

type DashboardState = {
  isSnapshotOpen: boolean
  isLogOpen: boolean
  isCustomizeOpen: boolean
  isEditingGuidance: boolean
}

type DashboardAction = 
  | { type: 'TOGGLE_SNAPSHOT'; payload?: boolean }
  | { type: 'TOGGLE_LOG'; payload?: boolean }
  | { type: 'TOGGLE_CUSTOMIZE'; payload?: boolean }
  | { type: 'TOGGLE_GUIDANCE'; payload?: boolean }

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'TOGGLE_SNAPSHOT': return { ...state, isSnapshotOpen: action.payload ?? !state.isSnapshotOpen }
    case 'TOGGLE_LOG': return { ...state, isLogOpen: action.payload ?? !state.isLogOpen }
    case 'TOGGLE_CUSTOMIZE': return { ...state, isCustomizeOpen: action.payload ?? !state.isCustomizeOpen }
    case 'TOGGLE_GUIDANCE': return { ...state, isEditingGuidance: action.payload ?? !state.isEditingGuidance }
    default: return state
  }
}

export function DashboardView() {
  const { dashboard: data, updateDashboard: update, isSaving, user } = useStore()
  const { logout } = useAuth()
  const ctx = use(ChatSessionContext)
  const temporaryChat = ctx?.temporaryChat ?? false
  const setTemporaryChat = ctx?.setTemporaryChat ?? (() => {})
  const navigate = useNavigate()
  
  const [state, dispatch] = useReducer(dashboardReducer, {
    isSnapshotOpen: false,
    isLogOpen: false,
    isCustomizeOpen: false,
    isEditingGuidance: false
  })

  const [planSettings, setPlanSettings] = useState([
    { label: 'Hormone Trends', active: true },
    { label: 'Body Signals', active: true },
    { label: 'Wellness Score', active: true },
    { label: 'Supplement Guide', active: false },
    { label: 'Partner Insights', active: true },
  ])
  const [mounted, setMounted] = useState(false)
  const [now, setNow] = useState<Date | null>(null)
  
  const [{ run, steps }, setTourState] = useState({
    run: false,
    steps: [
      {
        target: '.cycle-tracker-hero',
        content: "This is your partner's Cycle Tracker. See their current phase and predictions at a glance.",
        placement: 'right',
        disableBeacon: false,
      },
      {
        target: '.flo-story-bubble',
        content: "Tap these stories to quickly jump to insights, secret chats, or wellness tips.",
        placement: 'bottom',
      },
      {
        target: '.flo-feed-row .flo-card',
        content: "Today's Plan gives you phase-specific insights, body signals, and daily tips.",
        placement: 'top',
      },
      {
        target: '.flo-fab',
        content: "Use this to quickly log new symptoms or notes for the current day.",
        placement: 'left',
      }
    ] as Step[]
  })

  const startTour = () => {
    setTourState(s => ({ ...s, run: true }))
  }

  useEffect(() => {
    setMounted(true)
    setNow(new Date())
    const hasSeenTour = localStorage.getItem('mensflow_tour_completed')
    if (!hasSeenTour) {
      setTourState(s => ({ ...s, run: true }))
    }
  }, [])

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      localStorage.setItem('mensflow_tour_completed', 'true')
      setTourState(s => ({ ...s, run: false }))
    }
  }

  const guidanceText = useMemo(
    () => data.guidanceLines.join('\n'),
    [data.guidanceLines],
  )

<<<<<<< HEAD
  const handleLogout = () => {
    logout()
    navigate('/')
  }
=======
  const fmtSaved =
    lastSaved?.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }) ?? '-'
>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)

  const toggleTempChat = () => {
    const next = !temporaryChat
    setTemporaryChat(next)
    if (next) navigate('/ask')
  }

  const selectedDate = useMemo(() => {
    try {
      return data.lastPeriodStart ? parseISO(data.lastPeriodStart) : undefined
    } catch {
      return undefined
    }
  }, [data.lastPeriodStart])

  return (
<<<<<<< HEAD
    <div className="dashboard-flo-theme relative overflow-hidden">
      {mounted && (
        <Joyride
          steps={steps}
          run={run}
          continuous
          onEvent={handleJoyrideCallback}
          styles={{
            options: {
              primaryColor: '#f472b6', // Codebase pink accent
              backgroundColor: '#ffffff',
              textColor: '#1f161d',
              zIndex: 10000,
            }
          } as any}
        />
      )}
      <DashboardHeader 
        user={user}
        mounted={mounted}
        isSaving={isSaving}
        getGreeting={getGreeting}
        temporaryChat={temporaryChat}
        toggleTempChat={toggleTempChat}
        handleLogout={handleLogout}
        onStartTour={startTour}
      />

      <main className="flo-main-container pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
        <div className="flo-content-inner">
          <div className="flo-dashboard-top">
            <StoriesSection />
=======
    <div className="dashboard-live">
      <header className="dash-header">
        <div className="dash-header-left">
          <img src="/images/girl.png" alt="" className="dash-avatar" />
          <div>
            <p className="dash-kicker">Home</p>
            <h1 className="dash-title">
              {mounted ? getGreeting() : 'Welcome back'}, Daniella
            </h1>
          </div>
        </div>
        <div className="dash-header-meta">
          <span className="dash-pill">
            <CalendarBlank size={16} aria-hidden />
            Cycle day {cycleDay} · {data.typicalCycleDays}d typical length
          </span>
          <span className="dash-pill dash-pill--muted">
            Saved {fmtSaved}
          </span>
        </div>
        <p className="dash-sub">
          Here&apos;s your cycle overview and health insights for today.
        </p>
      </header>

      <div className="dash-stats-row">
        <div className="dash-stat">
          <span className="dash-stat-label">Projected phase</span>
          <span className="dash-stat-value">{data.phaseLabel}</span>
          <span className="dash-stat-hint">From your last updated snapshot</span>
        </div>
        <div className="dash-stat">
          <span className="dash-stat-label">Hormone focus</span>
          <span className="dash-stat-value dash-stat-value--sm">
            {data.hormoneTrend}
          </span>
          <span className="dash-stat-hint">Educational framing, not lab data</span>
        </div>
        <div className="dash-stat">
          <span className="dash-stat-label">Last period start</span>
          <span className="dash-stat-value dash-stat-value--sm">
            {data.lastPeriodStart}
          </span>
          <span className="dash-stat-hint">Update in Your snapshot below</span>
        </div>
      </div>

      <div className="dash-overview-body">
        <div className="dash-row-panels">
          <section className="dash-panel" aria-labelledby="phase-heading">
            <div className="dash-panel-head">
              <h2 id="phase-heading" className="dash-panel-title">
                Today&apos;s hormonal phase
              </h2>
            </div>
            <dl className="dash-dl">
              <div className="dash-dl-row">
                <dt>Phase</dt>
                <dd>{data.phaseLabel}</dd>
              </div>
              <div className="dash-dl-row">
                <dt>Hormone trend</dt>
                <dd>{data.hormoneTrend}</dd>
              </div>
              <div className="dash-dl-row">
                <dt>Body signals</dt>
                <dd>{data.bodySignals}</dd>
              </div>
            </dl>
          </section>

          <section className="dash-panel" aria-labelledby="guide-heading">
            <div className="dash-panel-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 id="guide-heading" className="dash-panel-title">
                Today&apos;s health guidance
              </h2>
              <button
                type="button"
                onClick={() => setIsEditingGuidance(!isEditingGuidance)}
                aria-label={isEditingGuidance ? "Save guidance" : "Edit guidance"}
                className="icon-btn"
                style={{ padding: '0.25rem' }}
              >
                {isEditingGuidance ? (
                  <Check size={18} className="text-primary" aria-hidden />
                ) : (
                  <PencilSimple size={18} className="text-muted-foreground opacity-50 hover:opacity-100 transition-opacity" aria-hidden />
                )}
              </button>
            </div>
            {isEditingGuidance ? (
              <>
                <textarea
                  className="dash-textarea dash-textarea--guidance"
                  aria-label="Guidance list - one line per tip"
                  rows={5}
                  value={guidanceText}
                  onChange={(e) => {
                    const lines = e.target.value
                      .split('\n')
                      .flatMap((s) => s.trim() ? [s.trim()] : [])
                    update({ guidanceLines: lines })
                  }}
                />
                <p className="dash-hint">
                  One short tip per line - your dashboard and Tips view both read from here in this demo.
                </p>
              </>
            ) : (
              <div style={{ flex: 1, padding: '0.5rem 1.25rem 1.25rem' }}>
                <ul className="guidance-list">
                  {data.guidanceLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>

        <section
          className="dash-panel dash-panel--snapshot"
          aria-labelledby="snapshot-heading"
        >
          <div className="dash-panel-head">
            <h2 id="snapshot-heading" className="dash-panel-title">
              <ClipboardText size={20} aria-hidden />
              Your snapshot
            </h2>
>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)
          </div>

<<<<<<< HEAD
          <div className="flo-dashboard-grid">
            <section className="flo-dashboard-left" aria-label="Cycle overview">
              <div className="flo-hero-panel">
                <CycleTrackerHero />
=======
            <div className="dash-snapshot-form">
              <div className="dash-snapshot-field">
                <label className="dash-field-label" htmlFor="dash-last-period">
                  Last period start
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="dash-last-period"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-card h-10 border-border",
                        !data.lastPeriodStart && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon size={16} className="mr-2 opacity-60" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(day) => {
                        if (day) {
                          update({ lastPeriodStart: format(day, "yyyy-MM-dd") })
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)
              </div>
            </section>

            <section className="flo-dashboard-right" aria-label="Daily plan">
              <FeedSection 
                data={data}
                computeCycleDay={computeCycleDay}
                dispatch={dispatch as React.Dispatch<{ type: string; payload?: boolean | undefined }>}
                state={state}
                guidanceText={guidanceText}
                update={update}
              />
            </section>
          </div>
        </div>
      </main>

      {/* Persistent Interaction Trigger */}
      <button 
        className="flo-fab"
        onClick={() => dispatch({ type: 'TOGGLE_LOG', payload: true })}
      >
        <div className="flo-fab-ripple" />
        <Plus size={28} weight="bold" />
      </button>

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

      {mounted && now && (
        <LogSymptomsModal 
          key={`log-${state.isLogOpen}`}
          isOpen={state.isLogOpen} 
          onOpenChange={(val) => dispatch({ type: 'TOGGLE_LOG', payload: val })}
          activeDay={computeCycleDay(data.lastPeriodStart, data.typicalCycleDays)}
          activeDate={now}
        />
      )}
    </div>
  )
}

import { Plus } from '@phosphor-icons/react'

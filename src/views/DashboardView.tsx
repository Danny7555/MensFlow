/* eslint-disable react-hooks/set-state-in-effect */
import { use, useReducer, useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
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
  
  useEffect(() => {
    setMounted(true)
    setNow(new Date())
  }, [])

  const guidanceText = useMemo(
    () => data.guidanceLines.join('\n'),
    [data.guidanceLines],
  )

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const toggleTempChat = () => {
    const next = !temporaryChat
    setTemporaryChat(next)
    if (next) navigate('/ask')
  }

  return (
    <div className="dashboard-flo-theme relative overflow-hidden">
      <DashboardHeader 
        user={user}
        mounted={mounted}
        isSaving={isSaving}
        getGreeting={getGreeting}
        temporaryChat={temporaryChat}
        toggleTempChat={toggleTempChat}
        handleLogout={handleLogout}
      />

      <main className="flo-main-container pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
        <div className="flo-content-inner">
          <div className="flo-dashboard-top">
            <StoriesSection />
          </div>

          <div className="flo-dashboard-grid">
            <section className="flo-dashboard-left" aria-label="Cycle overview">
              <div className="flo-hero-panel">
                <CycleTrackerHero />
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

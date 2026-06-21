import { useEffect, useReducer, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { CycleTrackerHero } from "@/components/tracker/CycleTrackerHero"
import { CycleStatsHero } from "@/components/tracker/CycleStatsHero"
import { CycleHistory } from "@/components/tracker/CycleHistory"
import { CycleTips } from "@/components/tracker/CycleTips"
import { HealthMetrics } from "@/components/tracker/HealthMetrics"
import { CycleLogs } from "@/components/tracker/CycleLogs"
import { useAuth } from "@/context/useAuth"
import { useStore } from "@/store/useStore"
import { TrackerSkeleton } from "@/components/skeletons/TrackerSkeleton"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type TrackerState = {
  isLoading: boolean
  selectedDay: number | null
  hoveredDay: number | null
}

type TrackerAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SELECTED_DAY'; payload: number }
  | { type: 'SET_HOVERED_DAY'; payload: number | null }

function trackerReducer(state: TrackerState, action: TrackerAction): TrackerState {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, isLoading: action.payload }
    case 'SET_SELECTED_DAY': return { ...state, selectedDay: action.payload }
    case 'SET_HOVERED_DAY': return { ...state, hoveredDay: action.payload }
    default: return state
  }
}

import { RequestAccessModal } from "@/components/dashboard/RequestAccessModal"

export function TrackerView() {
  const navigate = useNavigate()
  const { isSaving, dashboard: ownDashboard, partnerStatus, user, fetchPartnerStatus, fetchLogs, requestDetailedAccessAction } = useStore()
  const { isAuthenticated, openAuthModal } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [requestSent, setRequestSent] = useState(false)

  const isPartner = user?.role === 'partner'
  const showRestrictedView = isPartner && partnerStatus?.paired && partnerStatus?.privacyShareCycleDetails === false

  const handleOpenModal = () => setShowModal(true)

  const handleConfirmRequest = async (selectedFields: string[]) => {
    setShowModal(false)
    setRequestSent(true)
    await requestDetailedAccessAction(selectedFields)
    await fetchPartnerStatus()
  }

  // Swapped dashboard data source for partner role
  const data = useMemo(() => {
    if (user?.role === 'partner' && partnerStatus?.paired && partnerStatus?.cycle) {
      return partnerStatus.cycle
    }
    return ownDashboard
  }, [user?.role, partnerStatus, ownDashboard])

  // Real-time synchronization on load
  useEffect(() => {
    if (isAuthenticated) {
      fetchLogs()
      if (user?.role === 'partner') {
        fetchPartnerStatus()
      }
    }
  }, [isAuthenticated, user?.role, fetchPartnerStatus, fetchLogs])

  const [initialDay, setInitialDay] = useState(1)

  // Compute initial cycle day inside useEffect to avoid impurity in render
  useEffect(() => {
    const start = new Date(`${data.lastPeriodStart}T12:00:00`)
    if (!Number.isNaN(+start)) {
      const days = Math.floor((Date.now() - +start) / 86400000)
      const m = ((days % data.typicalCycleDays) + data.typicalCycleDays) % data.typicalCycleDays
      const timer = setTimeout(() => {
        setInitialDay(m + 1)
      }, 0)
      return () => clearTimeout(timer)
    } else {
      const timer = setTimeout(() => {
        setInitialDay(1)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [data.lastPeriodStart, data.typicalCycleDays])

  const [state, dispatch] = useReducer(trackerReducer, {
    isLoading: true,
    selectedDay: 1,
    hoveredDay: null,
  })

  // Derive active selection
  const selectedDay = state.selectedDay ?? initialDay

  useEffect(() => {
    // Sync selectedDay if initialDay changes (e.g. data loaded)
    dispatch({ type: 'SET_SELECTED_DAY', payload: initialDay })
  }, [initialDay])

  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: false })
  }, [])
  if (state.isLoading) {
    return <TrackerSkeleton />
  }

  // ── Gate 2: partner not yet connected to a lady ──────────────────────────
  if (isPartner && !partnerStatus?.paired) {
    return (
      <div className="flex flex-col h-full bg-background overflow-auto items-center justify-center p-6 min-h-[80vh]">
        <div className="max-w-[400px] w-full text-center bg-card border border-border p-6 rounded-2xl gap-5 relative overflow-hidden flex flex-col items-center">
          <div className="absolute top-0 right-0 size-28 bg-[var(--mf-accent)]/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="size-14 rounded-2xl bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] flex items-center justify-center mx-auto border border-[var(--mf-accent)]/10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-7">
              <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
            </svg>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-normal tracking-tight text-[var(--mf-text-strong)]">
              Not Connected Yet
            </h2>
            <p className="text-xs text-[var(--mf-muted)] leading-relaxed max-w-sm mx-auto">
              Cycle details are shared with you once you connect with your partner. Head to <strong>Partner Sync</strong> to pair up first.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (showRestrictedView) {
    return (
      <div className="flex flex-col h-full bg-background overflow-auto items-center justify-center p-6 min-h-[80vh]">
        <div className="max-w-[400px] w-full text-center bg-card border border-border p-6 rounded-2xl gap-5 relative overflow-hidden flex flex-col items-center">
          <div className="absolute top-0 right-0 size-28 bg-[var(--mf-accent)]/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="size-14 rounded-2xl bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] flex items-center justify-center mx-auto border border-[var(--mf-accent)]/10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-7">
              <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
            </svg>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] px-3 py-1 rounded-full border border-[var(--mf-accent)]/20 inline-block">
              Privacy Settings Active
            </span>
            <h2 className="text-xl font-normal tracking-tight text-[var(--mf-text-strong)]">
              Detailed Cycle Logs Private
            </h2>
            <p className="text-xs text-[var(--mf-muted)] leading-relaxed max-w-sm mx-auto">
              Your partner has kept cycle statistics, symptom logs, water tracking, and weight details private.
            </p>
          </div>

          <div className="w-full flex flex-col gap-2.5">
            <Button
              onClick={handleOpenModal}
              disabled={requestSent}
              className={cn(
                "w-full rounded-2xl text-xs h-11",
                requestSent 
                  ? "bg-emerald-500 hover:bg-emerald-500 text-white cursor-default" 
                  : "bg-[var(--mf-accent)] hover:bg-[var(--mf-accent)]/90 text-white"
              )}
            >
              {requestSent ? "Access Request Sent ✔" : "Request Detailed Access"}
            </Button>

            <Button
              onClick={() => navigate('/dashboard')}
              variant="secondary"
              className="w-full rounded-2xl text-xs h-11"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
        <RequestAccessModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onConfirm={handleConfirmRequest}
          isLoading={isSaving}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-auto relative">
      <div className="flex-1 w-full max-w-[1200px] mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-end mb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border/50">
            <span className="text-[11px] font-normal uppercase tracking-wider text-muted-foreground">
              {isSaving ? 'Syncing…' : 'All synced'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 lg:gap-10 items-start">
          {/* Main Column */}
          <div className="space-y-10 lg:space-y-12">
            <CycleTrackerHero 
              data={data}
              selectedDay={selectedDay}
              hoveredDay={state.hoveredDay}
              onSelectDay={(day) => dispatch({ type: 'SET_SELECTED_DAY', payload: day })}
              onHoverDay={(day) => dispatch({ type: 'SET_HOVERED_DAY', payload: day })}
            />
            <CycleLogs />
            <HealthMetrics />
            
            <div className="relative">
              <CycleHistory />
              {!isAuthenticated && (
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background pointer-events-none z-20 flex flex-col items-center justify-center">
                  <div className="absolute inset-0 backdrop-blur-[6px]" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 150px)' }} />
                  <div className="relative z-30 pointer-events-auto bg-card border border-border p-6 rounded-2xl text-center max-w-[360px] mx-auto mt-20">
                    <h3 className="text-base font-normal mb-1.5">Unlock your full history</h3>
                    <p className="text-muted-foreground text-xs mb-4">Log in to see past cycles, personalized tips, and partner sharing.</p>
                    <Button
                      onClick={() => openAuthModal()}
                      className="bg-[var(--mf-accent)] hover:bg-[var(--mf-accent)]/90 text-white rounded-full px-8"
                    >
                      Log in to access
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-8 lg:space-y-10">
            <CycleStatsHero />
            <CycleTips activeDay={state.hoveredDay ?? selectedDay} />
          </aside>
        </div>

      </div>
    </div>
  )
}

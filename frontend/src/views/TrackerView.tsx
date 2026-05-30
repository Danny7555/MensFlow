import { useEffect, useReducer, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { CycleTrackerHero } from "@/components/tracker/CycleTrackerHero"
import { CycleStatsHero } from "@/components/tracker/CycleStatsHero"
import { CycleHistory } from "@/components/tracker/CycleHistory"
import { CycleTips } from "@/components/tracker/CycleTips"
import { HealthMetrics } from "@/components/tracker/HealthMetrics"
import { CycleLogs } from "@/components/tracker/CycleLogs"
import { useAuth } from "@/context/useAuth"
import { Copy, Users, ShareNetwork, Check } from "@phosphor-icons/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { useStore } from "@/store/useStore"
import { TrackerSkeleton } from "@/components/skeletons/TrackerSkeleton"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type TrackerState = {
  isInviteModalOpen: boolean
  copied: boolean
  isLoading: boolean
  selectedDay: number | null
  hoveredDay: number | null
}

type TrackerAction =
  | { type: 'SET_INVITE_MODAL'; payload: boolean }
  | { type: 'SET_COPIED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SELECTED_DAY'; payload: number }
  | { type: 'SET_HOVERED_DAY'; payload: number | null }

function trackerReducer(state: TrackerState, action: TrackerAction): TrackerState {
  switch (action.type) {
    case 'SET_INVITE_MODAL': return { ...state, isInviteModalOpen: action.payload }
    case 'SET_COPIED': return { ...state, copied: action.payload }
    case 'SET_LOADING': return { ...state, isLoading: action.payload }
    case 'SET_SELECTED_DAY': return { ...state, selectedDay: action.payload }
    case 'SET_HOVERED_DAY': return { ...state, hoveredDay: action.payload }
    default: return state
  }
}

export function TrackerView() {
  const navigate = useNavigate()
  const { isSaving, dashboard: ownDashboard, partnerStatus, user, invitePartner, fetchPartnerStatus, fetchLogs } = useStore()
  const { isAuthenticated, openAuthModal } = useAuth()
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [requestSent, setRequestSent] = useState(false)

  const handleRequestAccess = () => {
    setRequestSent(true)
    toast.success("Access request sent! Your partner will receive a notification to enable detailed sharing.")
  }

  const showRestrictedView = user?.role === 'partner' && partnerStatus?.paired && partnerStatus?.privacyShareCycleDetails === false

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
    isInviteModalOpen: false,
    copied: false,
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
    const timer = setTimeout(() => dispatch({ type: 'SET_LOADING', payload: false }), 500)
    return () => clearTimeout(timer)
  }, [])

  const inviteUrl = `${window.location.origin}/sync?code=${user?.partnerCode || ''}`
  const copyLink = () => {
    navigator.clipboard.writeText(inviteUrl)
    dispatch({ type: 'SET_COPIED', payload: true })
    setTimeout(() => dispatch({ type: 'SET_COPIED', payload: false }), 2000)
  }

  const handleSendInvite = async () => {
    const email = inviteEmail.trim()
    if (!email) return
    setIsInviting(true)
    try {
      await invitePartner(email)
      setInviteEmail('')
      dispatch({ type: 'SET_INVITE_MODAL', payload: false })
    } catch {
      // Handled in store
    } finally {
      setIsInviting(false)
    }
  }

  if (state.isLoading) {
    return <TrackerSkeleton />
  }

  if (showRestrictedView) {
    return (
      <div className="flex flex-col h-full bg-background overflow-auto items-center justify-center p-6 min-h-[80vh]">
        <div className="max-w-[420px] w-full text-center bg-card border border-border p-8 sm:p-10 rounded-[2.5rem] shadow-xl space-y-6 relative overflow-hidden flex flex-col items-center">
          <div className="absolute top-0 right-0 size-32 bg-[var(--mf-accent)]/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="size-16 rounded-3xl bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] flex items-center justify-center mx-auto border border-[var(--mf-accent)]/10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-8">
              <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
            </svg>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] px-3 py-1 rounded-full border border-[var(--mf-accent)]/20 inline-block">
              Privacy Settings Active
            </span>
            <h2 className="text-2xl font-normal tracking-tight text-[var(--mf-text-strong)]">
              Detailed Cycle Logs Private
            </h2>
            <p className="text-xs text-[var(--mf-muted)] leading-relaxed max-w-sm mx-auto">
              Your partner has kept cycle statistics, symptom logs, water tracking, and weight details private.
            </p>
          </div>

          <div className="w-full flex flex-col gap-3">
            <button
              type="button"
              onClick={handleRequestAccess}
              disabled={requestSent}
              className={cn(
                "w-full py-3 text-white rounded-2xl text-xs font-semibold transition-all border-0 outline-none",
                requestSent 
                  ? "bg-emerald-500 cursor-default animate-in fade-in" 
                  : "bg-[var(--mf-accent)] hover:opacity-95 active:scale-98 cursor-pointer"
              )}
            >
              {requestSent ? "Access Request Sent ✔" : "Request Detailed Access"}
            </button>

            <button 
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 bg-muted text-[var(--mf-text-strong)] hover:bg-muted/80 rounded-2xl text-xs font-semibold transition-all active:scale-98 cursor-pointer border-0 outline-none"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-auto relative">
      <div className="flex-1 w-full max-w-[1200px] mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-end mb-4">
           <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border sync-pill">
            <span className="text-[10px] font-normal uppercase tracking-wider text-muted-foreground">
              {isSaving ? 'Syncing with cloud' : 'All data synced'}
            </span>
          </div>
        </div>

        
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 items-start mt-4">
          {/* Main Column */}
          <div className="space-y-12">
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
                  <div className="relative z-30 pointer-events-auto bg-card border border-border p-8 rounded-3xl text-center max-w-[400px] mx-auto mt-24">
                    <h3 className="text-xl font-normal mb-2">Unlock your full history</h3>
                    <p className="text-muted-foreground text-sm mb-6">Log in to see your past cycles, personalized tips, and partner sharing features.</p>
                    <button 
                       onClick={openAuthModal}
                      className="btn btn-primary px-8 py-3 rounded-full"
                    >
                      Log in to access
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-10">
            <CycleStatsHero />
            <CycleTips activeDay={state.hoveredDay ?? selectedDay} />
          </aside>
        </div>

        {isAuthenticated && user?.role === 'lady' && (!partnerStatus || !partnerStatus.paired) && (
          <div className="mt-16 mb-16 w-full max-w-[1100px] mx-auto">
            <div 
              role="button"
              tabIndex={0}
              onClick={() => dispatch({ type: 'SET_INVITE_MODAL', payload: true })}
              onKeyDown={(e) => e.key === 'Enter' && dispatch({ type: 'SET_INVITE_MODAL', payload: true })}
              className="bg-gradient-to-r from-[var(--mf-accent)] to-[#be185d] rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group cursor-pointer border border-white/10"
            >
              <div className="z-10 text-center md:text-left">
                <h3 className="text-2xl font-normal mb-2">Share your cycle with a partner</h3>
                <p className="text-white/80 max-w-[400px]">
                  Invite your partner to view your cycle phases and symptoms to improve communication and support.
                </p>
              </div>
              <button className="z-10 px-8 py-3 bg-white text-[var(--mf-accent)] rounded-full font-normal hover:scale-105 transition-transform">
                Invite Partner
              </button>
              <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:scale-110 transition-transform duration-700">
                 <img src="/images/girl.png" alt="" className="size-64 object-contain rotate-[-15deg]" />
              </div>
            </div>
          </div>
        )}

        <Dialog open={state.isInviteModalOpen} onOpenChange={(open) => dispatch({ type: 'SET_INVITE_MODAL', payload: open })}>
          <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none rounded-[32px] bg-background">
            <div className="p-6 sm:p-8">
              <DialogHeader className="mb-4">
                <div className="size-12 rounded-2xl bg-[var(--mf-accent-soft)] flex items-center justify-center text-[var(--mf-accent)] mb-4">
                  <ShareNetwork size={24} weight="duotone" />
                </div>
                <DialogTitle className="text-2xl font-normal tracking-tight">Invite your partner</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground pt-1">
                  Shared access allows your partner to see your cycle phases, symptoms, and daily insights.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label 
                    htmlFor="partner-email"
                    className="text-xs font-normal uppercase tracking-widest text-muted-foreground ml-1"
                  >
                    Partner's Email
                  </label>
                  <div className="relative">
                    <input 
                      id="partner-email"
                      type="email" 
                      placeholder="email@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSendInvite() }}
                      disabled={isInviting}
                      className="w-full h-14 px-5 rounded-2xl bg-muted/50 border border-border focus:border-[var(--mf-accent-border)] focus:bg-background transition-all outline-none text-base"
                    />
                    <button 
                      onClick={handleSendInvite}
                      disabled={isInviting || !inviteEmail.trim()}
                      className="absolute right-2 top-2 h-10 px-6 bg-[var(--mf-accent)] text-white rounded-xl text-sm font-normal hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isInviting ? 'Inviting...' : 'Invite'}
                    </button>
                  </div>
                </div>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-background px-4 text-muted-foreground tracking-widest font-normal">Or use a link</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/30 border border-border/50 group hover:border-border transition-colors">
                    <div className="flex-1 truncate text-xs text-muted-foreground font-mono">
                      {inviteUrl}
                    </div>
                    <button 
                      onClick={copyLink}
                      className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-xl text-xs font-normal hover:bg-muted transition-colors"
                    >
                      {state.copied ? (
                        <>
                          <Check size={14} className="text-green-500" weight="bold" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Copy link</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground text-center px-4">
                    This link will expire in 24 hours. Your partner will need their own account to join.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-muted/30 p-6 flex items-center gap-4 border-t border-border/50">
              <div className="size-10 rounded-full bg-background flex items-center justify-center border border-border">
                <Users size={18} className="text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You can manage or revoke access at any time from your <span className="text-foreground font-normal">Account Settings</span>.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

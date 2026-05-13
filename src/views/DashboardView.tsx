import { useEffect, useMemo, useState, useContext } from 'react'
import {
  CalendarBlank,
  PencilSimple,
  Check,
  Plus,
  Bell,
  Calendar as CalendarIcon,

  CaretRight,
  Sparkle,
  Target,
  Heartbeat,
  Pill,
  CheckCircle,
  Ghost,
  SignOut,
} from '@phosphor-icons/react'
import { parseISO, format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { useDashboardData } from '../context/useDashboardData'
import { useAuth } from '../context/useAuth'
import { ChatSessionContext } from '../context/chat-session-context'
import { CycleTrackerHero } from '../components/tracker/CycleTrackerHero'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '../components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover'
import { Calendar } from '../components/ui/calendar'
import { cn } from '../lib/utils'

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

export function DashboardView() {
  const { data, update } = useDashboardData()
  const { logout } = useAuth()
  const { temporaryChat, setTemporaryChat } = useContext(ChatSessionContext)
  const navigate = useNavigate()
  
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false)
  const [isEditingGuidance, setIsEditingGuidance] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const guidanceText = useMemo(
    () => data.guidanceLines.join('\n'),
    [data.guidanceLines],
  )

  const selectedDate = useMemo(() => {
    try {
      return data.lastPeriodStart ? parseISO(data.lastPeriodStart) : undefined
    } catch {
      return undefined
    }
  }, [data.lastPeriodStart])

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
      {/* Immersive Edge Illustrations - Visible but behind content */}
      <div className="flo-edge-wrap fixed left-[200px] top-[25%] w-[22%] opacity-[0.4] hidden lg:block z-1">
        <img src="/images/edge-left.png" alt="" className="flo-edge-img" />
      </div>
      <div className="flo-edge-wrap fixed -right-[5%] bottom-[10%] w-[22%] opacity-[0.4] hidden lg:block z-1">
        <img src="/images/edge-right.png" alt="" className="flo-edge-img" />
      </div>

      {/* Atmospheric Edge Blobs - Intensified */}
      <div className="fixed top-[-10%] -left-[10%] w-[50vw] h-[50vw] bg-[var(--mf-accent)] rounded-full blur-[140px] opacity-[0.08] pointer-events-none" />
      <div className="fixed bottom-[-10%] -right-[10%] w-[50vw] h-[50vw] bg-purple-500 rounded-full blur-[140px] opacity-[0.08] pointer-events-none" />

      {/* Flo-style Header - WIDENED */}
      <header className="flo-header !max-w-[1440px] !px-12 relative z-10">
        <div className="flo-header-left">
          <div className="flo-avatar-wrap">
            <img src="/images/girl.png" alt="Profile" className="flo-avatar" />
          </div>
          <div className="flo-greeting">
            <p className="flo-date">{format(new Date(), 'EEEE, d MMMM')}</p>
            <h1 className="flo-user-name">
              {mounted ? getGreeting() : 'Welcome'}, Daniella
            </h1>
          </div>
        </div>
        <div className="flo-header-right">
          <button 
            className={cn("flo-icon-btn", temporaryChat && "flo-icon-btn--active")}
            onClick={toggleTempChat}
            title={temporaryChat ? "Temporary chat: On" : "Temporary chat: Off"}
          >
            <Ghost size={20} weight={temporaryChat ? "fill" : "regular"} />
          </button>
          <button className="flo-icon-btn" aria-label="Notifications">
            <Bell size={24} weight="light" />
          </button>
          <button className="flo-icon-btn" aria-label="Calendar">
            <CalendarIcon size={24} weight="light" />
          </button>
          <button 
            className="flo-icon-btn text-destructive/70 hover:text-destructive"
            onClick={handleLogout}
            title="Log out"
          >
            <SignOut size={24} weight="light" />
          </button>
        </div>
      </header>

      {/* Main Content Area - WIDENED */}
      <div className="flo-content-scroll relative z-10">
        <div className="flo-content-inner !max-w-[1440px] !px-12">
          {/* Stories Bubbles */}
          <section className="flo-stories-section">
            <div className="flo-stories-container">
              {[
                { label: 'Daily Plan', image: '/images/star.png', active: true },
                { label: 'Insights', image: '/images/brain.png' },
                { label: 'Secret Chats', image: '/images/moon.png' },
                { label: 'Wellness', image: '/images/heart.png' },
                { label: 'Partner', image: '/images/girl.png' },
              ].map((story, i) => (
                <div key={i} className="flo-story-circle">
                  <div className={cn("flo-story-ring", story.active && "flo-story-ring--active")}>
                    <div className="flo-story-inner">
                      <img src={story.image} alt={story.label} className="flo-story-img" />
                    </div>
                    {story.active && <div className="flo-story-dot" />}
                  </div>
                  <span className="flo-story-label">{story.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Hero Section with Cycle Tracker */}
          <section className="flo-hero-section">
            <CycleTrackerHero />
          </section>

          {/* Today's Insights & Plan */}
          <section className="flo-feed-section">
            <div className="flo-section-header">
              <div className="flex flex-col gap-1">
                <h2 className="flo-section-title">Today's plan</h2>
                <div className="flo-progress-track">
                  <div className="flo-progress-fill" style={{ width: `${(computeCycleDay(data.lastPeriodStart, data.typicalCycleDays) / data.typicalCycleDays) * 100}%` }} />
                </div>
              </div>
              <button className="flo-text-link">Customize <CaretRight size={12} /></button>
            </div>

            <div className="flo-masonry-grid">
              {/* Primary Insight - Full Width/Prominent */}
              <div className="flo-card flo-card--prominent animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flo-card-top">
                  <div className="flex items-center gap-2">
                    <div className="flo-card-icon flo-card-icon--accent">
                      <Sparkle size={20} weight="fill" />
                    </div>
                    <p className="flo-card-title !mb-0">{data.phaseLabel} Phase</p>
                  </div>
                  <span className="text-[10px] bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] px-2.5 py-1 rounded-full font-semibold active-badge-glow">DAY {computeCycleDay(data.lastPeriodStart, data.typicalCycleDays)}</span>
                </div>
                <div className="flo-card-content mt-4">
                  <h3 className="flo-card-desc text-2xl tracking-tight">{data.hormoneTrend}</h3>
                  <p className="text-[0.95rem] text-[var(--mf-muted)] mt-3 leading-relaxed">
                    You're entering the peak of your luteal phase. Progesterone is dominant, which naturally increases your metabolic rate. You might feel a bit more hungry—this is your body asking for fuel.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[var(--mf-border)] flex items-center justify-between">
                  <span className="text-xs font-medium opacity-60">PROGESTERONE PEAK</span>
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-[var(--mf-card)] bg-[var(--mf-accent-soft)]" />)}
                  </div>
                </div>
              </div>

              {/* Secondary Stats Group */}
              <div className="flo-sub-grid">
                {/* Signals Card */}
                <div className="flo-card animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                  <div className="flo-card-top">
                    <div className="flo-card-icon flo-card-icon--pink">
                      <Target size={20} weight="fill" />
                    </div>
                  </div>
                  <div className="flo-card-content mt-2">
                    <p className="flo-card-title">Body Signals</p>
                    <h3 className="flo-card-desc text-lg">{data.bodySignals}</h3>
                    <p className="text-xs opacity-50 mt-2">Common for Day {computeCycleDay(data.lastPeriodStart, data.typicalCycleDays)}</p>
                  </div>
                </div>

                {/* Wellness Score Card */}
                <div className="flo-card animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                  <div className="flo-card-top">
                    <div className="flo-card-icon flo-card-icon--pink">
                      <Heartbeat size={20} weight="fill" />
                    </div>
                  </div>
                  <div className="flo-card-content mt-2">
                    <p className="flo-card-title">Wellness Score</p>
                    <div className="flex items-end gap-1">
                      <h3 className="flo-card-desc text-2xl font-medium text-[var(--mf-accent)]">84</h3>
                      <span className="text-xs mb-1.5 font-medium text-[var(--mf-accent)] opacity-60">/100</span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--mf-border)] rounded-full mt-3">
                      <div className="h-full bg-[var(--mf-accent)] rounded-full" style={{ width: '84%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Guidance Card - Large Column */}
              <div className="flo-card flo-card--featured animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                <div className="flo-card-top">
                  <div className="flex items-center gap-2">
                    <div className="flo-card-icon flo-card-icon--pink">
                      <Plus size={20} weight="fill" />
                    </div>
                    <p className="flo-card-title !mb-0">Daily Guidance</p>
                  </div>
                  <button 
                    onClick={() => setIsEditingGuidance(!isEditingGuidance)}
                    className="flo-edit-btn"
                  >
                    {isEditingGuidance ? <Check size={16} /> : <PencilSimple size={16} />}
                  </button>
                </div>
                
                <div className="mt-6">
                  {isEditingGuidance ? (
                    <textarea
                      className="flo-textarea"
                      rows={6}
                      value={guidanceText}
                      onChange={(e) => {
                        const lines = e.target.value
                          .split('\n')
                          .flatMap((s) => s.trim() ? [s.trim()] : [])
                        update({ guidanceLines: lines })
                      }}
                    />
                  ) : (
                    <div className="flex flex-col gap-6">
                      <div className="p-4 bg-[var(--mf-accent-soft)] rounded-2xl">
                        <p className="text-sm font-medium text-[var(--mf-accent)] leading-relaxed">
                          "Your body is prioritizing recovery today. Consider shifting high-intensity workouts to light yoga or a walk."
                        </p>
                      </div>
                      <ul className="flo-guidance-list">
                        {data.guidanceLines.map((line, idx) => (
                          <li key={idx} className="flo-guidance-item">
                            <div className="flo-guidance-dot" />
                            <span className="text-[0.98rem] font-medium opacity-90">{line}</span>
                          </li>
                        ))}
                      </ul>
                      
                      {/* Added content to fill the bottom */}
                      <div className="mt-8 pt-6 border-t border-[var(--mf-border)]">
                        <p className="flo-card-title !mb-3">Supplement Suggestion</p>
                        <div className="flex items-center gap-3 p-3 rounded-xl">
                          <div className="text-[var(--mf-accent)] flex items-center justify-center">
                            <Pill size={26} weight="fill" />
                          </div>
                          <div>
                            <p className="text-[0.9rem] font-semibold text-[var(--mf-text-strong)]">Magnesium (200mg)</p>
                            <p className="text-[0.75rem] text-[var(--mf-muted)]">Supports muscle recovery and sleep quality</p>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 opacity-40">
                          <CheckCircle size={14} className="text-[var(--mf-success)]" />
                          <span className="text-[10px] font-medium uppercase tracking-widest">92% users find this helpful</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Hormone Insight Card */}
              <div className="flo-card flo-card--dark animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                <div className="flo-card-top">
                  <p className="flo-card-title">Scientific Insight</p>
                  <Sparkle size={16} className="text-[var(--mf-accent)]" weight="fill" />
                </div>
                <div className="mt-3">
                  <p className="text-[0.95rem] text-[var(--mf-text)] opacity-90 leading-relaxed">
                    Did you know? Progesterone can raise your resting heart rate by <span className="text-[var(--mf-accent)] font-semibold">2-5 beats per minute</span> during this phase. Don't be alarmed if your tracker shows slightly higher exertion today.
                  </p>
                </div>
                <button className="text-[var(--mf-accent)] text-xs font-semibold mt-6 flex items-center gap-1.5 hover:gap-2 transition-all">
                  Read medical research <CaretRight size={12} />
                </button>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="mt-12 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Log Mood', img: '/images/happy.jpg' },
                { label: 'Weight', img: '/images/weight.png' },
                { label: 'Cravings', img: '/images/cravings.png' },
                { label: 'More', img: '/images/exp.jpg' },
              ].map(action => (
                <button key={action.label} className="flo-action-btn group p-4 rounded-3xl bg-[var(--mf-card)] border border-[var(--mf-border)] hover:bg-[var(--mf-hover)] transition-all flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden transition-transform group-hover:scale-110">
                    <img src={action.img} alt={action.label} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[0.7rem] font-bold uppercase tracking-widest text-[var(--mf-muted)] group-hover:text-[var(--mf-text-strong)] transition-colors">{action.label}</span>
                </button>
              ))}
            </div>

            {/* Snapshot Action Button */}
            <div className="flo-action-row mt-8">
              <button 
                className="flo-snap-btn"
                onClick={() => setIsSnapshotModalOpen(true)}
              >
                <CalendarBlank size={20} />
                Update Your Snapshot
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Flo-style FAB (Floating Action Button) - Visible on mobile only via CSS */}
      <button 
        className="flo-fab" 
        aria-label="Add log"
        onClick={() => setIsSnapshotModalOpen(true)}
      >
        <Plus size={28} weight="bold" />
      </button>

      {/* Snapshot Modal */}
      <Dialog open={isSnapshotModalOpen} onOpenChange={setIsSnapshotModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[32px] p-6 border-none">
          <DialogHeader>
            <DialogTitle className="text-2xl font-medium">Your Snapshot</DialogTitle>
            <DialogDescription>
              Update your cycle basics to get more accurate predictions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium ml-1">Last period start</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-12 rounded-2xl bg-muted/50 border-none",
                      !data.lastPeriodStart && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon size={18} className="mr-2 opacity-60" />
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
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium ml-1">Typical cycle length (days)</label>
              <input
                type="number"
                min={21}
                max={45}
                className="w-full h-12 px-4 rounded-2xl bg-muted/50 border-none outline-none focus:ring-2 ring-[var(--mf-accent)] transition-all"
                value={data.typicalCycleDays}
                onChange={(e) =>
                  update({
                    typicalCycleDays: Math.min(
                      45,
                      Math.max(21, Number(e.target.value) || 28),
                    ),
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium ml-1">Private notes</label>
              <textarea
                className="w-full p-4 rounded-2xl bg-muted/50 border-none outline-none focus:ring-2 ring-[var(--mf-accent)] transition-all resize-none"
                rows={3}
                placeholder="Symptoms, meds, questions..."
                value={data.cycleNotes}
                onChange={(e) => update({ cycleNotes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              className="w-full h-12 rounded-full bg-[var(--mf-accent)] text-white hover:brightness-110"
              onClick={() => setIsSnapshotModalOpen(false)}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

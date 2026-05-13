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
    <div className="dashboard-flo-theme">
      {/* Flo-style Header */}
      <header className="flo-header">
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

      {/* Main Content Area */}
      <div className="flo-content-scroll">
        <div className="flo-content-inner">
          {/* Stories Bubbles */}
          <div className="flo-stories-container">
            {[
              { label: 'Daily Plan', image: '/images/star.png' },
              { label: 'Insights', image: '/images/brain.png' },
              { label: 'Secret Chats', image: '/images/moon.png' },
              { label: 'Wellness', image: '/images/heart.png' },
              { label: 'Partner', image: '/images/girl.png' },
            ].map((story, i) => (
              <div key={i} className="flo-story-circle">
                <div className="flo-story-ring">
                  <div className="flo-story-inner">
                    <img src={story.image} alt={story.label} className="flo-story-img" />
                  </div>
                </div>
                <span className="flo-story-label">{story.label}</span>
              </div>
            ))}
          </div>

          {/* Hero Section with Cycle Tracker */}
          <section className="flo-hero-section">
            <CycleTrackerHero />
          </section>

          {/* Daily Insights Feed */}
          <section className="flo-feed-section">
            <div className="flo-section-header">
              <h2 className="flo-section-title">Today's health story</h2>
              <button className="flo-text-link">See all <CaretRight size={12} /></button>
            </div>

            <div className="flo-grid">
              {/* Phase Card */}
              <div className="flo-card flo-card--highlight">
                <div className="flo-card-top">
                  <div className="flo-card-icon flo-card-icon--accent">
                    <Sparkle size={20} weight="fill" />
                  </div>
                </div>
                <div className="flo-card-content flex flex-col gap-1">
                  <p className="flo-card-title">{data.phaseLabel} Phase</p>
                  <h3 className="flo-card-desc">{data.hormoneTrend}</h3>
                </div>
              </div>

              {/* Signals Card */}
              <div className="flo-card">
                <div className="flo-card-top">
                  <div className="flo-card-icon flo-card-icon--teal">
                    <Target size={20} weight="bold" />
                  </div>
                </div>
                <div className="flo-card-content flex flex-col gap-1">
                  <p className="flo-card-title">Body Signals</p>
                  <h3 className="flo-card-desc">{data.bodySignals}</h3>
                </div>
              </div>

              {/* My Cycles Card */}
              <div className="flo-card">
                <div className="flo-card-top">
                  <div className="flo-card-icon flo-card-icon--purple">
                    <CalendarBlank size={20} weight="bold" />
                  </div>
                </div>
                <div className="flo-card-content flex flex-col gap-1">
                  <p className="flo-card-title">My Cycles</p>
                  <h3 className="flo-card-desc">Regular · {data.typicalCycleDays} days</h3>
                </div>
              </div>

              {/* Guidance Card */}
              <div className="flo-card flo-card--span-2">
                <div className="flo-card-top">
                  <div className="flex items-center gap-2">
                    <div className="flo-card-icon flo-card-icon--pink">
                      <Heartbeat size={20} weight="bold" />
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
                
                {isEditingGuidance ? (
                  <textarea
                    className="flo-textarea"
                    rows={4}
                    value={guidanceText}
                    onChange={(e) => {
                      const lines = e.target.value
                        .split('\n')
                        .flatMap((s) => s.trim() ? [s.trim()] : [])
                      update({ guidanceLines: lines })
                    }}
                  />
                ) : (
                  <ul className="flo-guidance-list">
                    {data.guidanceLines.map((line, idx) => (
                      <li key={idx} className="flo-guidance-item">
                        <div className="flo-guidance-dot" />
                        {line}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Snapshot Action Button */}
            <div className="flo-action-row">
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

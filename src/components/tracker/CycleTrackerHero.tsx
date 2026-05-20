/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useEffect, useMemo, useReducer } from 'react'
import { CaretDown, CaretRight, Info, Lightning, Heart, Sparkle, Chat } from '@phosphor-icons/react'
import { format, addDays, startOfDay } from 'date-fns'

import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'

import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import { useStore } from '@/store/useStore'
import { LogSymptomsModal } from './LogSymptomsModal'
import { DailyQuiz } from '../dashboard/DailyCheckIn'
import { CycleWheel } from './CycleWheel'

interface CycleTrackerHeroProps {
  showCheckIn?: boolean
}

interface CycleTrackerState {
  currentDay: number
  selectedDay: number
  hoveredDay: number | null
  trackingMode: string
  isLogModalOpen: boolean
}

type CycleTrackerAction =
  | { type: 'SET_CURRENT_DAY'; payload: number }
  | { type: 'SET_SELECTED_DAY'; payload: number }
  | { type: 'SET_HOVERED_DAY'; payload: number | null }
  | { type: 'SET_TRACKING_MODE'; payload: string }
  | { type: 'SET_LOG_MODAL_OPEN'; payload: boolean }
  | { type: 'INIT_DAYS'; currentDay: number; selectedDay: number }

function cycleTrackerReducer(state: CycleTrackerState, action: CycleTrackerAction): CycleTrackerState {
  switch (action.type) {
    case 'SET_CURRENT_DAY':
      return { ...state, currentDay: action.payload }
    case 'SET_SELECTED_DAY':
      return { ...state, selectedDay: action.payload }
    case 'SET_HOVERED_DAY':
      return { ...state, hoveredDay: action.payload }
    case 'SET_TRACKING_MODE':
      return { ...state, trackingMode: action.payload }
    case 'SET_LOG_MODAL_OPEN':
      return { ...state, isLogModalOpen: action.payload }
    case 'INIT_DAYS':
      return { ...state, currentDay: action.currentDay, selectedDay: action.selectedDay }
    default:
      return state
  }
}

export function CycleTrackerHero({ showCheckIn = false }: CycleTrackerHeroProps) {
  const { dashboard: data } = useStore()
  
  const [state, dispatch] = useReducer(cycleTrackerReducer, {
    currentDay: 1,
    selectedDay: 1,
    hoveredDay: null,
    trackingMode: 'Period',
    isLogModalOpen: false,
  })

  const { currentDay, selectedDay, hoveredDay, trackingMode, isLogModalOpen } = state

  useEffect(() => {
    const start = new Date(`${data.lastPeriodStart}T12:00:00`)
    if (!Number.isNaN(+start)) {
      const days = Math.floor((Date.now() - +start) / 86400000)
      const m = ((days % data.typicalCycleDays) + data.typicalCycleDays) % data.typicalCycleDays
      const day = m + 1
      dispatch({ type: 'INIT_DAYS', currentDay: day, selectedDay: day })
    }
  }, [data.lastPeriodStart, data.typicalCycleDays])

  const modes = ['Period', 'Conception', 'Pregnancy', 'Perimenopause'];

  const cycleLength = data.typicalCycleDays;

  const periodLength = 5;
  const predictedPeriodLength = 2; 
  const fertileStart = 10;
  const fertileEnd = 16;
  const ovulationDay = 14;
  const upcomingStart = 23;
  const upcomingEnd = 27;

  const today = useMemo(() => startOfDay(new Date()), []);

  const getDayDate = (day: number) => {
    const diff = day - currentDay;
    return addDays(today, diff);
  };

  const getDayInfo = (day: number) => {
    if (day <= periodLength) return { label: 'Period', color: '#dc2626', phase: 'Menstrual Phase' };
    if (day <= periodLength + predictedPeriodLength) return { label: 'Luteal', color: '#ffc7c8', phase: 'Follicular Phase' };
    if (day >= fertileStart && day <= fertileEnd) {
       if (day === ovulationDay) return { label: 'Ovulation', color: '#26899e', phase: 'Fertile Window' };
       return { label: 'Fertile', color: '#26899e', phase: 'Fertile Window' };
    }
    if (day >= upcomingStart) return { label: 'Upcoming', color: '#999', phase: 'Luteal Phase' };
    return { label: 'Stable', color: '#aaa', phase: 'Follicular Phase' };
  };

  const activeDay = hoveredDay ?? selectedDay;
  const activeInfo = getDayInfo(activeDay);
  const activeDate = getDayDate(activeDay);

  return (
    <div className="cycle-tracker-hero relative">
      <div className="cycle-tracker-mode">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="mode-chip">
              Mode: MensFlow {trackingMode}
              <CaretDown size={14} weight="bold" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-card border-border">
            {modes.map((m) => (
              <DropdownMenuItem 
                key={m} 
                onClick={() => dispatch({ type: 'SET_TRACKING_MODE', payload: m })}
                className="text-sm font-regular focus:bg-[var(--mf-accent-soft)] focus:text-[var(--mf-accent)] cursor-pointer"
              >
                {m}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="cycle-tracker-viz">
        <div className="viz-ring-container">
          <CycleWheel
            cycleLength={cycleLength}
            currentDay={currentDay}
            selectedDay={selectedDay}
            hoveredDay={hoveredDay}
            periodLength={periodLength}
            predictedPeriodLength={predictedPeriodLength}
            fertileStart={fertileStart}
            fertileEnd={fertileEnd}
            upcomingStart={upcomingStart}
            upcomingEnd={upcomingEnd}
            onSelectDay={(day) => dispatch({ type: 'SET_SELECTED_DAY', payload: day })}
            onHoverDay={(day) => dispatch({ type: 'SET_HOVERED_DAY', payload: day })}
          />

          <div className="viz-content">
            {/* Chance of pregnancy indicator - moved to top to avoid overlap */}
            <div className="mb-6 animate-in fade-in zoom-in duration-700">
                <span 
                  className="px-5 py-1.5 rounded-full text-[9px] font-medium uppercase tracking-widest transition-colors duration-300"
                  style={{ 
                    color: activeInfo.color,
                  }}
                >
                 {activeDay >= fertileStart && activeDay <= fertileEnd ? 'High' : 'Low'} pregnancy chance
               </span>
            </div>

            <p className="viz-today">{format(activeDate, 'EEEE, d MMM')}</p>
            <h2 className="viz-title" style={{ color: activeInfo.color }}>
              {activeDay === currentDay 
                ? `Next period: ${format(addDays(today, cycleLength - currentDay + 1), 'd MMM')}`
                : activeInfo.phase
              }
            </h2>
            <div className="viz-fertile-status" style={{ color: activeInfo.color }}>
              <span className="flex items-center gap-1">
                {activeInfo.label} 
                {activeDay === currentDay && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="hover:opacity-70 transition-opacity">
                        <Info size={14} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[200px] text-xs">
                      This represents your current phase in the menstrual cycle based on your logs.
                    </TooltipContent>
                  </Tooltip>
                )}
              </span>
              <CaretDown size={14} className="mt-0.5 opacity-50" />
            </div>
          </div>

          <div className="viz-day-badge">
             <div className="badge-inner">
                <span className="badge-label">{activeDay === currentDay ? 'Today' : 'Day'}</span>
                <span className="badge-value">{activeDay}</span>
                <span className="text-[10px] font-medium opacity-40 mt-0.5">{format(activeDate, 'd MMM').toUpperCase()}</span>
             </div>
          </div>
        </div>
      </div>

      <div className="cycle-tracker-mood-cta">
        <div 
          role="button"
          tabIndex={0}
          onClick={() => dispatch({ type: 'SET_LOG_MODAL_OPEN', payload: true })}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') dispatch({ type: 'SET_LOG_MODAL_OPEN', payload: true }) }}
          className="mood-cta-card cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mf-accent)] rounded-2xl"
        >
           <img src="/images/exp.jpg" alt="" className="mood-cta-bg" />
           <div className="mood-cta-overlay" />
           <span className="mood-text pl-4">Log symptoms for Day {activeDay}</span>
           <CaretRight size={20} className="caret-right group-hover:translate-x-1 transition-transform" />
        </div>

        {showCheckIn && (
          <>
            <div className="mt-8">
              <div className="flo-card flo-card--prominent relative overflow-hidden group transition-all duration-500">
                {/* Background Bloom */}
                <div className="absolute -top-12 -right-12 size-32 bg-[var(--mf-accent)] opacity-5 blur-3xl rounded-full group-hover:opacity-10 transition-opacity" />
                
                <div className="flex items-start justify-between mb-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="w-fit text-[9px] font-semibold uppercase tracking-[0.15em] bg-[var(--mf-accent)] text-white px-2.5 py-1 rounded-full">DAILY TIP</span>
                    <span className="text-[10px] font-medium text-[var(--mf-accent)] opacity-85">PHASE: LUTEAL</span>
                  </div>
                  <div className="size-10 rounded-full bg-white/50 dark:bg-black/20 flex items-center justify-center text-[var(--mf-accent)]">
                    <Lightning size={20} weight="fill" />
                  </div>
                </div>

                <div className="relative z-10">
                  <h3 className="text-[15px] font-semibold text-[var(--mf-text-strong)] mb-2 tracking-tight">Nurture your energy</h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed opacity-90">
                    Your body is working harder today. Prioritize magnesium-rich foods like dark chocolate or spinach to ease any pre-period tension.
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-[var(--mf-border)] flex items-center justify-between">
                  <button className="text-[11px] font-medium text-[var(--mf-accent)] hover:underline">LEARN MORE</button>
                  <button className="flex items-center gap-1.5 text-[11px] font-medium opacity-75 hover:opacity-100 transition-opacity">
                    <Heart size={14} /> SAVE
                  </button>
                </div>
              </div>
            </div>

            {/* Daily Quiz rendered natively in the left column */}
            <DailyQuiz />
            
            {/* Filler section to balance columns */}
            <div className="flo-card flo-card--featured mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-700 bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="size-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-500">
                    <Sparkle size={16} weight="fill" />
                  </div>
                  <h3 className="text-[15px] font-semibold text-[var(--mf-text-strong)] tracking-tight">Partner Sync</h3>
                </div>
                <p className="text-[13px] text-muted-foreground leading-relaxed mt-1">
                  Her energy levels might naturally dip in the coming days. Offering to handle dinner or a few extra chores can make a huge difference right now.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[var(--mf-border)]">
                <a 
                  href={`sms:?body=${encodeURIComponent("Hey! Thinking of you. Let me know if you need anything, I can handle dinner or whatever else you need today. ❤️")}`}
                  className="flex items-center justify-center gap-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-600 dark:hover:bg-amber-700 py-2.5 px-4 rounded-xl transition-all duration-300 w-full active:scale-95"
                >
                  <Chat size={16} weight="fill" />
                  Text Her Support
                </a>
              </div>
            </div>
          </>
        )}
      </div>

      <LogSymptomsModal 
        isOpen={isLogModalOpen} 
        onOpenChange={(open) => dispatch({ type: 'SET_LOG_MODAL_OPEN', payload: open })} 
        activeDay={activeDay} 
        activeDate={activeDate}
      />
    </div>
  )
}

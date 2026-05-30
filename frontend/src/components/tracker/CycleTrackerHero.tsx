"use client"

import { useEffect, useMemo, useReducer, useState } from 'react'

import { 
  CaretDown, 
  CaretRight, 
  Info,
} from '@phosphor-icons/react'
import { format, addDays, startOfDay, differenceInCalendarDays, parseISO } from 'date-fns'
import { toast } from 'sonner'

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
import { CycleWheel } from './CycleWheel'

export interface CycleTrackerData {
  lastPeriodStart: string
  typicalCycleDays: number
  phaseLabel?: string
  hormoneTrend?: string
  bodySignals?: string
  cycleVariationDays?: number
  isAtypical?: boolean
  scientificInsight?: string
  dailyTip?: {
    title: string
    desc: string
  }
}

interface CycleTrackerHeroProps {
  showCheckIn?: boolean
  selectedDay?: number
  hoveredDay?: number | null
  onSelectDay?: (day: number) => void
  onHoverDay?: (day: number | null) => void
  data?: CycleTrackerData
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

export function CycleTrackerHero({ 
  showCheckIn = false,
  selectedDay: controlledSelectedDay,
  hoveredDay: controlledHoveredDay,
  onSelectDay,
  onHoverDay,
  data: propData,
}: CycleTrackerHeroProps) {
  const { dashboard: storeData, user } = useStore()
  const data = propData || storeData
  const isPartner = user?.role === 'partner'
  
  const [state, dispatch] = useReducer(cycleTrackerReducer, {
    currentDay: 1,
    selectedDay: 1,
    hoveredDay: null,
    trackingMode: 'Period',
    isLogModalOpen: false,
  })

  const { trackingMode, isLogModalOpen } = state

  const isControlled = controlledSelectedDay !== undefined
  const selectedDay = isControlled ? controlledSelectedDay : state.selectedDay
  const hoveredDay = isControlled ? (controlledHoveredDay ?? null) : state.hoveredDay

  const [currentDay, setCurrentDay] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (data.lastPeriodStart) {
        const start = parseISO(data.lastPeriodStart)
        const startValid = !Number.isNaN(start.getTime())
        if (startValid) {
          const days = differenceInCalendarDays(new Date(), start)
          const m = ((days % data.typicalCycleDays) + data.typicalCycleDays) % data.typicalCycleDays
          const calculatedDay = m + 1
          setCurrentDay(calculatedDay)
          dispatch({ type: 'INIT_DAYS', currentDay: calculatedDay, selectedDay: calculatedDay })
        } else {
          setCurrentDay(1)
          dispatch({ type: 'INIT_DAYS', currentDay: 1, selectedDay: 1 })
        }
      } else {
        setCurrentDay(1)
        dispatch({ type: 'INIT_DAYS', currentDay: 1, selectedDay: 1 })
      }
    }, 0)
    return () => clearTimeout(timer)
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
        {isPartner ? (
          <div className="mode-chip cursor-default bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 font-normal text-xs tracking-wider flex items-center gap-1.5">
            <img src="/images/heart.png" alt="" className="size-3.5 object-contain animate-pulse" />
            <span>Partner Empathy Mode</span>
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="mode-chip">
                Mode: MensFlow {trackingMode}
                <CaretDown size={14} weight="regular" />
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
        )}
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
            onSelectDay={(day) => {
              if (isControlled && onSelectDay) onSelectDay(day)
              else dispatch({ type: 'SET_SELECTED_DAY', payload: day })
            }}
            onHoverDay={(day) => {
              if (isControlled && onHoverDay) onHoverDay(day)
              else dispatch({ type: 'SET_HOVERED_DAY', payload: day })
            }}
          />

          <div className="viz-content">
            {/* Chance of pregnancy indicator - moved to top to avoid overlap */}
            <div className="mb-6 animate-in fade-in zoom-in duration-700">
                <span 
                  className="px-5 py-1.5 rounded-full text-[9px] font-normal uppercase tracking-widest transition-colors duration-300"
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
                ? `${isPartner ? 'Her next period' : 'Next period'}: ${format(addDays(today, cycleLength - currentDay + 1), 'd MMM')}`
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
                      {isPartner
                        ? "This represents your partner's current phase in her cycle based on her details."
                        : "This represents your current phase in the menstrual cycle based on your logs."
                      }
                    </TooltipContent>
                  </Tooltip>
                )}
              </span>
              <CaretDown size={14} className="mt-0.5 opacity-50" />
            </div>
          </div>

          <div className="viz-day-badge">
             <div className="badge-inner">
                <span className="badge-label">
                  {activeDay === currentDay ? (isPartner ? 'Her Today' : 'Today') : 'Day'}
                </span>
                <span className="badge-value">{activeDay}</span>
                <span className="text-[10px] font-normal opacity-40 mt-0.5">{format(activeDate, 'd MMM').toUpperCase()}</span>
             </div>
          </div>
        </div>
      </div>

      <div className="cycle-tracker-mood-cta">
        {isPartner ? (
          <div 
            role="button"
            tabIndex={0}
            onClick={() => {
              const el = document.querySelector('.partner-translation-card')
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' })
              } else {
                toast.info("Empathy & supportive tips are available on your dashboard playbook!")
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                const el = document.querySelector('.partner-translation-card')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }
            }}
            className="mood-cta-card cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mf-accent)] rounded-2xl"
          >
             <img src="/images/calm.jpg" alt="" className="mood-cta-bg opacity-80" />
             <div className="mood-cta-overlay bg-gradient-to-r from-teal-900/60 to-indigo-900/50" />
             <span className="mood-text pl-4 flex items-center gap-2">
               <img src="/images/heart.png" alt="" className="size-4 object-contain animate-pulse shrink-0" />
               <span>View Empathy Decoder & Playbook</span>
             </span>
             <CaretRight size={20} className="caret-right group-hover:translate-x-1 transition-transform text-teal-400" />
          </div>
        ) : (
          <div 
            role="button"
            tabIndex={0}
            onClick={() => dispatch({ type: 'SET_LOG_MODAL_OPEN', payload: true })}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') dispatch({ type: 'SET_LOG_MODAL_OPEN', payload: true }) }}
            className="mood-cta-card cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mf-accent)] rounded-2xl"
          >
             <img src="/images/exp.jpg" alt="" className="mood-cta-bg" />
             <div className="mood-cta-overlay" />
             <span className="mood-text pl-4">
               Log symptoms for Day {activeDay}
             </span>
             <CaretRight size={20} className="caret-right group-hover:translate-x-1 transition-transform" />
          </div>
        )}

        {showCheckIn && (
          <div className="mt-8">

          </div>
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

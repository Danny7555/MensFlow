/* eslint-disable */
"use client"

import { useEffect, useMemo, useReducer, useState, memo } from 'react'

import { 
  CaretDown, 
  CaretRight, 
  Info,
  Flask,
  CalendarPlus,
  Drop,
} from '@phosphor-icons/react'
import { format, addDays, startOfDay } from 'date-fns'
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

const modes = ['Period', 'Conception', 'Pregnancy', 'Perimenopause'];

const emptyStateCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '1.25rem 1rem',
  borderRadius: '1.25rem',
  background: 'color-mix(in srgb, var(--mf-accent) 8%, transparent)',
  border: '1px solid color-mix(in srgb, var(--mf-accent) 20%, transparent)',
  backdropFilter: 'blur(8px)',
  maxWidth: '220px',
  textAlign: 'center',
}

function CycleTrackerHeroInner({ 
  showCheckIn = false,
  selectedDay: controlledSelectedDay,
  hoveredDay: controlledHoveredDay,
  onSelectDay,
  onHoverDay,
  data: propData,
}: CycleTrackerHeroProps) {
  const { dashboard: storeData, user, settings, logs } = useStore()
  const data = propData || storeData
  const isPartner = user?.role === 'partner'

  // Detect if this user has no cycle data at all (fresh account / no logs)
  const hasNoCycleData = !data.lastPeriodStart && logs.length === 0
  
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
        // Use noon-anchored ms calculation to stay consistent with computeCycleDay() in cycleUtils
        const safeLen = Math.max(1, data.typicalCycleDays || 28)
        const start = new Date(`${data.lastPeriodStart}T12:00:00`)
        const startValid = !Number.isNaN(start.getTime())
        if (startValid) {
          const days = Math.floor((Date.now() - start.getTime()) / 86400000)
          const m = ((days % safeLen) + safeLen) % safeLen
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



  const cycleLength = data.typicalCycleDays || 28;

  const periodLength = Math.min(14, Math.max(1, Math.round(settings.cyclePeriodLengthDays || 5)));
  const predictedPeriodLength = 2; 

  const standardOvulation = cycleLength - 14;

  const { fertileStart, fertileEnd, ovulationDay } = useMemo(() => {
    let start = standardOvulation - 4; // Day 10 for L=28
    let end = standardOvulation + 2;   // Day 16 for L=28
    let ovDay = standardOvulation;      // Day 14 for L=28

    if (settings.conditionOptimization === 'pcos') {
      start = 10;
      end = Math.min(24, cycleLength - 4);
      ovDay = -1; // Unpredictable
    } else if (settings.conditionOptimization === 'perimenopause') {
      start = 9;
      end = Math.min(22, cycleLength - 6);
      ovDay = -1; // Unpredictable
    }
    return { fertileStart: start, fertileEnd: end, ovulationDay: ovDay };
  }, [standardOvulation, cycleLength, settings.conditionOptimization]);

  const upcomingStart = cycleLength - 5;
  const upcomingEnd = cycleLength - 1;

  const today = useMemo(() => startOfDay(new Date()), []);

  const getDayDate = (day: number) => {
    const diff = day - currentDay;
    return addDays(today, diff);
  };

  const getDayInfo = (day: number) => {
    if (day <= periodLength) return { label: 'Period', color: '#f43f5e', phase: 'Menstrual Phase' };
    if (day <= periodLength + predictedPeriodLength) return { label: 'Light Flow', color: '#fda4af', phase: 'Late Menstrual' };
    if (day >= fertileStart && day <= fertileEnd) {
       if (settings.conditionOptimization === 'pcos') {
         return { label: 'Variable Fertile', color: '#8b5cf6', phase: 'Irregular Fertile Window' };
       }
       if (settings.conditionOptimization === 'perimenopause') {
         return { label: 'Erratic Fertile', color: '#f59e0b', phase: 'Unpredictable Fertile Window' };
       }
       if (day === ovulationDay) return { label: 'Ovulation', color: '#26899e', phase: 'Peak Fertile Day' };
       return { label: 'Fertile', color: '#26899e', phase: 'Fertile Window' };
    }
    if (day >= upcomingStart) return { label: 'Pre-Period', color: '#d97706', phase: 'Luteal / PMS Phase' };
    return { label: 'Follicular', color: '#0d9488', phase: 'Follicular Phase' };
  };

  const activeDay = hoveredDay ?? selectedDay;
  const activeInfo = getDayInfo(activeDay);
  const activeDate = getDayDate(activeDay);
  const activeDateStr = format(activeDate, 'yyyy-MM-dd')
  const activeLog = logs.find((l) => l.date === activeDateStr)

  const getPcosTooltipText = () => {
    switch (settings.conditionOptimization) {
      case 'pcos':
        return "PCOS Optimization Active. Predicting variable ovulation windows based on irregular cycle modeling."
      case 'endometriosis':
        return "Endometriosis Pain Logging Active. Tracking daily inflammation levels."
      case 'perimenopause':
        return "Perimenopause Transition Active. Monitoring hormonal shifts and hot flashes."
      default:
        return "This represents your current phase in the menstrual cycle based on your logs."
    }
  }

  // --- Empty state for fresh users with no cycle data ---
  if (hasNoCycleData && !isPartner) {
    return (
      <div className="cycle-tracker-hero relative">
        <div className="cycle-tracker-mode flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="mode-chip">
                Mode: {trackingMode === 'Conception' ? 'Conception (NFP)' : `MensFlow ${trackingMode}`}
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
        </div>

        <div className="cycle-tracker-viz">
          <div className="viz-ring-container">
            {/* Ghost / dimmed wheel placeholder */}
            <CycleWheel
              cycleLength={28}
              currentDay={1}
              selectedDay={1}
              hoveredDay={null}
              periodLength={5}
              predictedPeriodLength={2}
              fertileStart={10}
              fertileEnd={16}
              upcomingStart={23}
              upcomingEnd={27}
              fertileColor="#26899e"
              onSelectDay={() => {}}
              onHoverDay={() => {}}
              dimmed
            />

            {/* Overlay empty-state card */}
            <div
              className="viz-content"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <div
                className="animate-in fade-in zoom-in duration-500"
                style={emptyStateCardStyle}
              >
                <div
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '50%',
                    background: 'color-mix(in srgb, var(--mf-accent) 15%, transparent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CalendarPlus size={20} style={{ color: 'var(--mf-accent)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--mf-accent)', lineHeight: 1.2 }}>
                    No cycle data yet
                  </p>
                  <p style={{ fontSize: '0.75rem', opacity: 0.6, lineHeight: 1.4 }}>
                    Log your first entry below to see your personalised cycle insights
                  </p>
                </div>
              </div>
            </div>

            <div className="viz-day-badge" style={{ opacity: 0.35 }}>
              <div className="badge-inner">
                <span className="badge-label">Day</span>
                <span className="badge-value">–</span>
                <span className="text-[10px] font-normal opacity-40 mt-0.5">–</span>
              </div>
            </div>
          </div>
        </div>

        <div className="cycle-tracker-mood-cta">
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_LOG_MODAL_OPEN', payload: true })}
            className="w-full text-left p-0 border-none outline-none bg-transparent mood-cta-card cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mf-accent)] rounded-2xl"
          >
            <img src="/images/exp.jpg" alt="" className="mood-cta-bg" />
            <div className="mood-cta-overlay" />
            <span className="mood-text pl-4">Log your first cycle entry</span>
            <CaretRight size={20} className="caret-right group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <LogSymptomsModal
          isOpen={isLogModalOpen}
          onOpenChange={(open) => dispatch({ type: 'SET_LOG_MODAL_OPEN', payload: open })}
          activeDay={1}
          activeDate={today}
        />
      </div>
    )
  }

  return (
    <div className="cycle-tracker-hero relative">
      <div className="cycle-tracker-mode flex flex-wrap items-center gap-2">
        {isPartner ? (
          <div className="mode-chip cursor-default bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 font-normal text-xs tracking-wider flex items-center gap-1.5">
            <img src="/images/heart.png" alt="" className="size-3.5 object-contain animate-pulse" />
            <span>Partner Empathy Mode</span>
          </div>
        ) : (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="mode-chip">
                  Mode: {trackingMode === 'Conception' ? 'Conception (NFP)' : `MensFlow ${trackingMode}`}
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
          {settings.conditionOptimization !== 'none' && (
            <div className="px-2.5 py-1 rounded-full text-[10px] font-normal uppercase tracking-wider bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/25">
              {settings.conditionOptimization.toUpperCase()} MODE
            </div>
          )}
          </>
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
            showFertileWindow={settings.cycleShowFertileWindow}
            fertileColor={
              settings.conditionOptimization === 'pcos' ? '#8b5cf6' :
              settings.conditionOptimization === 'perimenopause' ? '#f59e0b' :
              '#26899e'
            }
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
            {/* Chance of pregnancy indicator — only shown when cycle data exists and fertile window hints are on */}
            {data.lastPeriodStart && settings.cycleShowFertileWindow && (
              <div className="mb-6 animate-in fade-in zoom-in duration-700">
                <span
                  className="px-5 py-1.5 rounded-full text-[9px] font-normal uppercase tracking-widest transition-colors duration-300"
                  style={{ color: activeInfo.color }}
                >
                  {trackingMode === 'Conception'
                    ? (activeDay >= fertileStart && activeDay <= fertileEnd
                        ? (settings.conditionOptimization === 'pcos' || settings.conditionOptimization === 'perimenopause'
                            ? 'Variable Fertility Window (Monitor BBT/Mucus)'
                            : 'Peak fertility window (Symptothermal NFP)')
                        : 'Non-fertile phase (NFP prediction)')
                    : (activeDay >= fertileStart && activeDay <= fertileEnd
                        ? (settings.conditionOptimization === 'pcos' || settings.conditionOptimization === 'perimenopause'
                            ? 'Unpredictable pregnancy chance'
                            : 'High pregnancy chance')
                        : 'Low pregnancy chance')
                  }
                </span>
              </div>
            )}

            <p className="viz-today">{format(activeDate, 'EEEE, d MMM')}</p>
            <h2 className="viz-title" style={{ color: activeInfo.color }}>
              {activeDay === currentDay 
                ? `${isPartner ? 'Her next period' : 'Next period'}: ${format(addDays(today, cycleLength - currentDay), 'd MMM')}`
                : activeInfo.phase
              }
            </h2>
            {/* Symptothermal and Flow indicators */}
            {activeLog && (
              (activeLog.lhLevel !== undefined && activeLog.lhLevel !== null) || 
              activeLog.mucus || 
              activeLog.symptoms.some(s => s.startsWith('flow-'))
            ) && (
              <div className="flex justify-center gap-2 mt-1 mb-2 animate-in fade-in duration-300">
                {activeLog.symptoms.find(s => s.startsWith('flow-')) && (
                  (() => {
                    const activeFlow = activeLog.symptoms.find(s => s.startsWith('flow-'))!;
                    return (
                      <span className="text-[10px] font-medium bg-[#ff5a5f]/15 text-[#ff5a5f] border border-[#ff5a5f]/25 px-2 py-0.5 rounded-full flex items-center gap-1 capitalize">
                        <Drop size={12} weight="fill" className="text-[#ff5a5f]" />
                        <span>Flow: {activeFlow.replace('flow-', '')}</span>
                      </span>
                    )
                  })()
                )}
                {activeLog.lhLevel !== undefined && activeLog.lhLevel !== null && (
                  <span className="text-[10px] font-medium bg-[#e07a5f]/15 text-[#e07a5f] border border-[#e07a5f]/25 px-2 py-0.5 rounded-full flex items-center gap-1 capitalize">
                    <Flask size={12} className="text-[#e07a5f]" aria-hidden="true" />
                    <span>LH: {activeLog.lhLevel}</span>
                  </span>
                )}
                {activeLog.mucus && (
                  <span className="text-[10px] font-medium bg-[#26899e]/15 text-[#26899e] border border-[#26899e]/25 px-2 py-0.5 rounded-full flex items-center gap-1.5 capitalize">
                    <img src="/images/water.png" alt="" className="size-3 object-contain shrink-0" />
                    <span>{activeLog.mucus.replace('-', ' ')}</span>
                  </span>
                )}
              </div>
            )}
            <div className="viz-fertile-status" style={{ color: activeInfo.color }}>
              <span className="flex items-center gap-1">
                {activeInfo.label} 
                {activeDay === currentDay && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="hover:opacity-70 transition-opacity">
                        <Info size={14} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[200px] text-xs">
                      {isPartner
                        ? "This represents your partner's current phase in her cycle based on her details."
                        : getPcosTooltipText()
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
          <button 
            type="button"
            onClick={() => {
              const el = document.querySelector('.partner-translation-card')
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' })
              } else {
                toast.info("Empathy & supportive tips are available on your dashboard playbook!")
              }
            }}
            className="w-full text-left p-0 border-none outline-none bg-transparent mood-cta-card cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mf-accent)] rounded-2xl"
          >
             <img src="/images/calm.jpg" alt="" className="mood-cta-bg opacity-80" />
             <div className="mood-cta-overlay bg-gradient-to-r from-teal-900/60 to-indigo-900/50" />
             <span className="mood-text pl-4 flex items-center gap-2">
                <img src="/images/heart.png" alt="" className="size-4 object-contain animate-pulse shrink-0" />
                <span>View Empathy Decoder & Playbook</span>
             </span>
             <CaretRight size={20} className="caret-right group-hover:translate-x-1 transition-transform text-teal-400" />
          </button>
        ) : (
          <button 
            type="button"
            onClick={() => dispatch({ type: 'SET_LOG_MODAL_OPEN', payload: true })}
            className="w-full text-left p-0 border-none outline-none bg-transparent mood-cta-card cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mf-accent)] rounded-2xl"
          >
             <img src="/images/exp.jpg" alt="" className="mood-cta-bg" />
             <div className="mood-cta-overlay" />
             <span className="mood-text pl-4">
                Log symptoms for Day {activeDay}
             </span>
             <CaretRight size={20} className="caret-right group-hover:translate-x-1 transition-transform" />
          </button>
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

export const CycleTrackerHero = memo(CycleTrackerHeroInner)

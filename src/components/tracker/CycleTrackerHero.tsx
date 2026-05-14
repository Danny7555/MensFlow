<<<<<<< HEAD
/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useState, useEffect, useMemo } from 'react'
import { CaretDown, CaretRight, Info, Lightning, Heart } from '@phosphor-icons/react'
=======
"use client"

import { useState, useMemo } from 'react'
import { CaretDown, CaretRight, Smiley, Info } from '@phosphor-icons/react'
>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)
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

<<<<<<< HEAD
import { useStore } from '@/store/useStore'
import { LogSymptomsModal } from './LogSymptomsModal'

export function CycleTrackerHero() {
  const { dashboard: data } = useStore()
  
  const [currentDay, setCurrentDay] = useState(1)
  const [selectedDay, setSelectedDay] = useState<number>(1);
=======
import { LogSymptomsModal } from './LogSymptomsModal'

export function CycleTrackerHero() {
  const [selectedDay, setSelectedDay] = useState<number>(12);
>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [trackingMode, setTrackingMode] = useState<string>('Period');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)

<<<<<<< HEAD
  useEffect(() => {
    const start = new Date(`${data.lastPeriodStart}T12:00:00`)
    if (!Number.isNaN(+start)) {
      const days = Math.floor((Date.now() - +start) / 86400000)
      const m = ((days % data.typicalCycleDays) + data.typicalCycleDays) % data.typicalCycleDays
      const day = m + 1
      setCurrentDay(day)
      setSelectedDay(day)
    }
  }, [data.lastPeriodStart, data.typicalCycleDays])

  const modes = ['Period', 'Conception', 'Pregnancy', 'Perimenopause'];

  const cycleLength = data.typicalCycleDays;
  // currentDay already defined above
=======
  const modes = ['Period', 'Conception', 'Pregnancy', 'Perimenopause'];

  const cycleLength = 27;
  const currentDay = 12;
>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)

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

  const radius = 44;
  const center = 50;

  function polarToCartesian(angleInDegrees: number, r = radius) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: center + (r * Math.cos(angleInRadians)),
      y: center + (r * Math.sin(angleInRadians))
    };
  }

  function describeArc(startAngle: number, endAngle: number) {
    const start = polarToCartesian(endAngle);
    const end = polarToCartesian(startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  }

  function getAngle(day: number) {
    return (day / cycleLength) * 360;
  }

  const periodPath = describeArc(0, getAngle(periodLength));
  const predictedPath = describeArc(getAngle(periodLength), getAngle(periodLength + predictedPeriodLength));
  const fertilePath = describeArc(getAngle(fertileStart - 1), getAngle(fertileEnd));
  const upcomingPath = describeArc(getAngle(upcomingStart - 1), getAngle(upcomingEnd));

  const activeDay = hoveredDay ?? selectedDay;
  const activeInfo = getDayInfo(activeDay);
  const activeDate = getDayDate(activeDay);

  const dots = Array.from({ length: cycleLength }).map((_, i) => {
    const day = i + 1;
    const angle = getAngle(day - 0.5); 
    const r = 37;
    const pos = polarToCartesian(angle, r);
    const isSelected = selectedDay === day;
    const isToday = currentDay === day;
    
    let color = 'transparent';
    if (day <= currentDay) {
      if (day <= periodLength) color = '#dc2626';
      else if (day === 7) color = '#2563eb'; 
      else if (day === 11) color = '#059669'; 
      else if (day === currentDay) color = '#1a4d57'; 
    }
    
    return (
      <g 
        key={i} 
        style={{ cursor: 'pointer' }}
        onMouseEnter={() => setHoveredDay(day)}
        onMouseLeave={() => setHoveredDay(null)}
        onClick={() => setSelectedDay(day)}
      >
        <circle 
          cx={pos.x} 
          cy={pos.y} 
          r={isSelected ? 3 : 2} 
          fill={isSelected ? '#1a4d57' : (color !== 'transparent' ? color : 'currentColor')} 
          opacity={isSelected ? 1 : (day <= periodLength ? 0.8 : 0.4)}
        />
        {isToday && !isSelected && (
          <circle cx={pos.x} cy={pos.y} r="4" fill="none" stroke="#1a4d57" strokeWidth="0.5" opacity="0.5" />
        )}
      </g>
    );
  });

  const currentPos = polarToCartesian(getAngle(selectedDay - 0.5), 44);

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
                onClick={() => setTrackingMode(m)}
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
          <svg viewBox="0 0 100 100" className="viz-ring" style={{ overflow: 'visible' }}>
            {/* Background track (dashed) */}
<<<<<<< HEAD
            <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="6" className="opacity-10" strokeDasharray="0.1 2.5" strokeLinecap="round" />
=======
            <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="9" className="opacity-10" strokeDasharray="0.1 2.5" strokeLinecap="round" />
>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)
            
            {/* Inner Dots */}
            {dots}
            
            {/* Segments */}
            <g className="viz-segments" style={{ pointerEvents: 'none' }}>
<<<<<<< HEAD
              <path d={periodPath} fill="none" stroke="#dc2626" strokeWidth="6" strokeLinecap="round" opacity="1" />
              <path d={predictedPath} fill="none" stroke="#ffc7c8" strokeWidth="6" strokeLinecap="round" opacity={activeDay > periodLength && activeDay <= periodLength + predictedPeriodLength ? 1 : 0.8} />
              <path d={fertilePath} fill="none" stroke="#26899e" strokeWidth="6" strokeLinecap="round" opacity={activeDay >= fertileStart && activeDay <= fertileEnd ? 1 : 0.8} />
              <path d={upcomingPath} fill="none" stroke="currentColor" strokeWidth="6" className="opacity-20" strokeLinecap="round" />
=======
              <path d={periodPath} fill="none" stroke="#dc2626" strokeWidth="9" strokeLinecap="round" opacity="1" />
              <path d={predictedPath} fill="none" stroke="#ffc7c8" strokeWidth="9" strokeLinecap="round" opacity={activeDay > periodLength && activeDay <= periodLength + predictedPeriodLength ? 1 : 0.8} />
              <path d={fertilePath} fill="none" stroke="#26899e" strokeWidth="9" strokeLinecap="round" opacity={activeDay >= fertileStart && activeDay <= fertileEnd ? 1 : 0.8} />
              <path d={upcomingPath} fill="none" stroke="currentColor" strokeWidth="9" className="opacity-20" strokeLinecap="round" />
>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)
            </g>

            {/* Selection Marker */}
            <circle 
              cx={currentPos.x} 
              cy={currentPos.y} 
              r="4.5" 
              fill="white" 
              stroke="#1a4d57" 
              strokeWidth="2" 
            />
          </svg>

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
<<<<<<< HEAD
          role="button"
          tabIndex={0}
          onClick={() => setIsLogModalOpen(true)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsLogModalOpen(true) }}
          className="mood-cta-card cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mf-accent)] rounded-2xl"
        >
           <img src="/images/exp.jpg" alt="" className="mood-cta-bg" />
           <div className="mood-cta-overlay" />
           <span className="mood-text pl-4">Log symptoms for Day {activeDay}</span>
           <CaretRight size={20} className="caret-right group-hover:translate-x-1 transition-transform" />
        </div>

        <div className="mt-8 px-1">
          <div className="p-6 rounded-[24px] bg-gradient-to-br from-[var(--mf-accent-soft)] to-white dark:to-card border border-[var(--mf-accent-border)] relative overflow-hidden group transition-all duration-500">
            {/* Background Bloom */}
            <div className="absolute -top-12 -right-12 size-32 bg-[var(--mf-accent)] opacity-5 blur-3xl rounded-full group-hover:opacity-10 transition-opacity" />
            
            <div className="flex items-start justify-between mb-4">
              <div className="flex flex-col gap-1.5">
                <span className="w-fit text-[9px] font-bold uppercase tracking-[0.15em] bg-[var(--mf-accent)] text-white px-2.5 py-1 rounded-full">DAILY TIP</span>
                <span className="text-[10px] font-semibold text-[var(--mf-accent)] opacity-60">PHASE: LUTEAL</span>
              </div>
              <div className="size-10 rounded-full bg-white/50 dark:bg-black/20 flex items-center justify-center text-[var(--mf-accent)]">
                <Lightning size={20} weight="fill" />
              </div>
            </div>

            <div className="relative z-10">
              <h3 className="text-[15px] font-bold text-[var(--mf-text-strong)] mb-2 tracking-tight">Nurture your energy</h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed opacity-90">
                Your body is working harder today. Prioritize magnesium-rich foods like dark chocolate or spinach to ease any pre-period tension.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-[var(--mf-accent-border)] flex items-center justify-between">
              <button className="text-[11px] font-bold text-[var(--mf-accent)] hover:underline">LEARN MORE</button>
              <button className="flex items-center gap-1.5 text-[11px] font-bold opacity-40 hover:opacity-100 transition-opacity">
                <Heart size={14} /> SAVE
              </button>
            </div>
          </div>
        </div>
=======
          onClick={() => setIsLogModalOpen(true)}
          className="mood-cta-card cursor-pointer group"
        >
           <img src="/images/exp.jpg" alt="" className="mood-cta-bg" />
           <div className="mood-cta-overlay" />
           <div className="mood-icon group-hover:scale-110 transition-transform">
             <Smiley size={24} weight="fill" />
           </div>
           <span className="mood-text">Log symptoms for Day {activeDay}</span>
           <CaretRight size={20} className="caret-right group-hover:translate-x-1 transition-transform" />
        </div>
>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)
      </div>

      <LogSymptomsModal 
        isOpen={isLogModalOpen} 
        onOpenChange={setIsLogModalOpen} 
        activeDay={activeDay} 
<<<<<<< HEAD
        activeDate={activeDate}
=======
>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)
      />
    </div>
  )
}

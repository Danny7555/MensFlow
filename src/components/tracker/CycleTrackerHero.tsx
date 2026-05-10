import { useState, useMemo } from 'react'
import { CaretDown, CaretRight, Smiley, Info } from '@phosphor-icons/react'
import { format, addDays, startOfDay } from 'date-fns'


export function CycleTrackerHero() {
  const [selectedDay, setSelectedDay] = useState<number>(12);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const cycleLength = 27;
  const currentDay = 12;

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
    const r = 35;
    const pos = polarToCartesian(angle, r);
    
    const isSelected = selectedDay === day;

    const isToday = currentDay === day;
    
    let color = 'transparent';
    if (day <= currentDay) {
      if (day <= periodLength) color = '#dc2626'; // Improved contrast red
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
          fill={isSelected ? '#1a4d57' : (color !== 'transparent' ? color : 'var(--mf-muted)')} 
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
    <div className="cycle-tracker-hero">
      <div className="cycle-tracker-mode">
        <button className="mode-chip">
          Mode: Clue Period Tracking
          <CaretDown size={14} weight="bold" />
        </button>
      </div>

      <div className="cycle-tracker-viz">
        <div className="viz-ring-container">
          <svg viewBox="0 0 100 100" className="viz-ring" style={{ overflow: 'visible' }}>
            {/* Background track (dashed) */}
            <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="12" className="opacity-10" strokeDasharray="0.1 2.5" strokeLinecap="round" />
            
            {/* Inner Dots */}
            {dots}
            
            {/* Segments */}
            <g className="viz-segments" style={{ pointerEvents: 'none' }}>
              <path d={periodPath} fill="none" stroke="#dc2626" strokeWidth="12" strokeLinecap="round" opacity="1" />
              <path d={predictedPath} fill="none" stroke="#ffc7c8" strokeWidth="12" strokeLinecap="round" opacity={activeDay > periodLength && activeDay <= periodLength + predictedPeriodLength ? 1 : 0.8} />
              <path d={fertilePath} fill="none" stroke="#26899e" strokeWidth="12" strokeLinecap="round" opacity={activeDay >= fertileStart && activeDay <= fertileEnd ? 1 : 0.8} />
              <path d={upcomingPath} fill="none" stroke="currentColor" strokeWidth="12" className="opacity-20" strokeLinecap="round" />
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
            
            {/* Day 1 marker */}
            <g transform="translate(45, 1) scale(0.4)">
               <path d="M12 2.15C12 2.15 4 10.15 4 15.65C4 20.07 7.58 23.65 12 23.65C16.42 23.65 20 20.07 20 15.65C20 10.15 12 2.15 12 2.15Z" fill="#d62f33" />
            </g>
          </svg>

          <div className="viz-content">
            <p className="viz-today">{format(activeDate, 'EEEE, d MMM')}</p>
            <h2 className="viz-title" style={{ color: activeInfo.color }}>
              {activeDay === currentDay 
                ? `Next period: ${format(addDays(today, cycleLength - currentDay + 1), 'd MMM')}`
                : activeInfo.phase
              }
            </h2>
            <div className="viz-fertile-status" style={{ color: activeInfo.color }}>
              <span className="flex items-center gap-1">
                {activeInfo.label} {activeDay === currentDay && <Info size={14} />}
              </span>
              <CaretDown size={14} className="mt-0.5 opacity-50" />
            </div>
          </div>

          <div className="viz-day-badge">
             <div className="badge-inner">
                <span className="badge-label">{activeDay === currentDay ? 'Today' : 'Day'}</span>
                <span className="badge-value">{activeDay}</span>
                <span className="text-[10px] font-bold opacity-40 mt-0.5">{format(activeDate, 'd MMM').toUpperCase()}</span>
             </div>
          </div>

        </div>
      </div>

      <div className="cycle-tracker-mood-cta">
        <div className="mood-cta-card">
           <img src="/images/exp.jpg" alt="" className="mood-cta-bg" />
           <div className="mood-cta-overlay" />
           <div className="mood-icon">
             <Smiley size={24} weight="fill" />
           </div>
           <span className="mood-text">Log symptoms for Day {activeDay}</span>
           <CaretRight size={20} className="caret-right" />
        </div>
      </div>

    </div>
  )
}


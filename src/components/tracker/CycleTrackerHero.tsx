import { CaretDown, CaretRight, Smiley } from '@phosphor-icons/react'

export function CycleTrackerHero() {
  const cycleLength = 28;
  const currentDay = 12;

  // Phases (in days)
  const periodLength = 5;
  const predictedPeriodLength = 2; // e.g. day 6, 7
  const fertileStart = 10;
  const fertileEnd = 16;
  const upcomingStart = 24;
  const upcomingEnd = 28;

  const radius = 44;
  const center = 50;

  function polarToCartesian(angleInDegrees: number) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: center + (radius * Math.cos(angleInRadians)),
      y: center + (radius * Math.sin(angleInRadians))
    };
  }

  function describeArc(startAngle: number, endAngle: number) {
    const start = polarToCartesian(endAngle);
    const end = polarToCartesian(startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    // We add a tiny gap by adjusting the angles if we want, but user requested 'close' so we keep them exact
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  }

  function getAngle(day: number) {
    return (day / cycleLength) * 360;
  }

  const periodPath = describeArc(0, getAngle(periodLength));
  const predictedPath = describeArc(getAngle(periodLength), getAngle(periodLength + predictedPeriodLength));
  const fertilePath = describeArc(getAngle(fertileStart - 1), getAngle(fertileEnd));
  const upcomingPath = describeArc(getAngle(upcomingStart - 1), getAngle(upcomingEnd));

  const dots = Array.from({ length: cycleLength }).map((_, i) => {
    const day = i + 1;
    const angle = getAngle(day - 0.5); 
    const r = 35;
    const x = center + r * Math.cos((angle - 90) * Math.PI / 180);
    const y = center + r * Math.sin((angle - 90) * Math.PI / 180);
    
    let color = 'transparent';
    if (day <= currentDay) {
      if (day === 3) color = '#d62f33'; 
      if (day === 7) color = '#2563eb'; 
      if (day === 11) color = '#059669'; 
      if (day === currentDay) color = '#1a4d57'; 
    }
    
    return color !== 'transparent' ? (
      <circle key={i} cx={x} cy={y} r="1.5" fill={color} opacity="0.9" />
    ) : (
      <circle key={i} cx={x} cy={y} r="0.6" fill="var(--mf-muted)" opacity="0.4" />
    )
  });

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
            {/* Period Segment (Red) */}
            <path d={periodPath} fill="none" stroke="#d62f33" strokeWidth="12" strokeLinecap="round" />
            
            {/* Luteal/Predicted Segment (Light Pink) */}
            <path d={predictedPath} fill="none" stroke="#ffc7c8" strokeWidth="12" strokeLinecap="round" />

            {/* Fertile Segment (Teal) */}
            <path d={fertilePath} fill="none" stroke="#26899e" strokeWidth="12" strokeLinecap="round" />

            {/* Upcoming Segment (Grey) */}
            <path d={upcomingPath} fill="none" stroke="currentColor" strokeWidth="12" className="opacity-20" strokeLinecap="round" />
            
            {/* Droplet icon at the top (Day 1 marker) */}
            <g transform="translate(45, 1) scale(0.4)">
               <path d="M12 2.15C12 2.15 4 10.15 4 15.65C4 20.07 7.58 23.65 12 23.65C16.42 23.65 20 20.07 20 15.65C20 10.15 12 2.15 12 2.15Z" fill="#d62f33" />
            </g>
          </svg>

          <div className="viz-content">
            <p className="viz-today">Today, 17. Oct</p>
            <h2 className="viz-title">Your next period is due 2. Nov</h2>
            <div className="viz-fertile-status">
              <span>Potential fertile day</span>
              <CaretDown size={14} className="mt-0.5" />
            </div>
          </div>

          <div className="viz-day-badge">
             <div className="badge-inner">
                <span className="badge-label">Day</span>
                <span className="badge-value">{currentDay}</span>
             </div>
          </div>
        </div>
      </div>

      <div className="cycle-tracker-mood-cta">
        <div className="mood-cta-card">
           <div className="mood-icon">
             <Smiley size={24} weight="fill" />
           </div>
           <span className="mood-text">How do you feel today?</span>
           <CaretRight size={20} className="text-[#f60]" />
        </div>
      </div>
    </div>
  )
}

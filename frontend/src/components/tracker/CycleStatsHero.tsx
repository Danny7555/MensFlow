import { useState } from 'react'
import { Info, Warning, CaretRight, ShieldCheck } from '@phosphor-icons/react'
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useStore } from '@/store/useStore'
import { SnapshotModal } from '../dashboard/SnapshotModal'
import { differenceInDays, parseISO } from 'date-fns'

export function CycleStatsHero() {
  const { logs, dashboard: ownDashboard, partnerStatus, user, updateDashboard, isSaving } = useStore()
  const [isSnapshotOpen, setIsSnapshotOpen] = useState(false)
  
  const data = (user?.role === 'partner' && partnerStatus?.paired && partnerStatus?.cycle)
    ? partnerStatus.cycle
    : ownDashboard

  const canEdit = user?.role !== 'partner'

  // Group flow logs into periods to count cycle lengths
  const flowDates = logs
    .flatMap(l => l.symptoms.some(s => s.startsWith('flow-')) ? [l.date] : [])
    .sort();

  const periodStarts: Date[] = [];
  let prevDate: Date | null = null;
  for (const dateStr of flowDates) {
    const d = parseISO(dateStr);
    if (!prevDate || differenceInDays(d, prevDate) > 4) {
      periodStarts.push(d);
    }
    prevDate = d;
  }

  const cycleLengths: number[] = [];
  for (let i = 0; i < periodStarts.length - 1; i++) {
    const len = differenceInDays(periodStarts[i + 1], periodStarts[i]);
    cycleLengths.push(len);
  }

  let calculatedTypical = data.typicalCycleDays || 28;
  let calculatedVariation = data.cycleVariationDays !== undefined ? data.cycleVariationDays : 8;

  if (cycleLengths.length > 0) {
    calculatedTypical = Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length);
    
    if (cycleLengths.length > 1) {
      const mean = cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length;
      const variance = cycleLengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / cycleLengths.length;
      calculatedVariation = Math.round(Math.sqrt(variance));
    } else {
      calculatedVariation = 0;
    }
  }

  const calculatedIsAtypical = calculatedTypical < 24 || calculatedTypical > 35 || calculatedVariation > 14;

  const lengthPercent = Math.min(100, Math.max(15, Math.round((calculatedTypical / 40) * 100)));
  const variationPercent = Math.min(100, Math.max(5, Math.round((calculatedVariation / 15) * 100)));
  const variationColor = calculatedIsAtypical ? "#e25c00" : "#007e94";

  return (
    <div className="cycle-stats-hero">
      <div className="stats-banner">
        <img loading="lazy" src="/images/mens.jpg" alt="" className="stats-banner-img" />
        <div className="stats-banner-overlay">
          <h2 className="stats-title">Cycle statistics</h2>
          <p className="stats-subtitle">Averages based on your last 6 cycles</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stats-card">
          <div className="stats-card-main">
            <div className="stats-ring-box">
               <svg viewBox="0 0 36 36" className="stats-ring stats-ring--teal">
                 <path d="M18 3 a 15 15 0 0 1 0 30 a 15 15 0 0 1 0 -30" fill="none" stroke="currentColor" className="opacity-10" strokeWidth="4" />
                 <path d="M18 3 a 15 15 0 0 1 0 30 a 15 15 0 0 1 0 -30" fill="none" stroke="#007e94" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${lengthPercent}, 100`} />
               </svg>
            </div>
            <div className="stats-card-info">
               <span className="stats-label">Cycle length</span>
               <span className="stats-value">{calculatedTypical} days</span>
            </div>
          </div>
          <div className="stats-card-action">
             <div className="stats-divider" />
             <Tooltip>
               <TooltipTrigger asChild>
                 <button 
                   type="button" 
                   onClick={() => canEdit && setIsSnapshotOpen(true)}
                   className={`stats-more-btn ${canEdit ? 'cursor-pointer hover:bg-[var(--mf-hover)]' : 'cursor-default'}`}
                 >
                    <div className="flex items-center gap-2">
                      <Info size={18} weight="regular" />
                      <span>More info</span>
                    </div>
                    {canEdit && <CaretRight size={16} />}
                 </button>
               </TooltipTrigger>
               <TooltipContent side="top" className="text-xs">
                 {canEdit 
                   ? "Click to edit typical cycle length and other snapshot details." 
                   : "Average length of your partner's cycle over the last 6 months."}
               </TooltipContent>
             </Tooltip>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-card-main">
            <div className="stats-ring-box">
               <svg viewBox="0 0 36 36" className="stats-ring stats-ring--grey">
                 <path d="M18 3 a 15 15 0 0 1 0 30 a 15 15 0 0 1 0 -30" fill="none" stroke="currentColor" className="opacity-10" strokeWidth="4" />
                 <path d="M18 3 a 15 15 0 0 1 0 30 a 15 15 0 0 1 0 -30" fill="none" stroke={variationColor} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${variationPercent}, 100`} />
                 {/* Trailing dots */}
                 <circle cx="12" cy="5.5" r="1.2" fill={variationColor} />
                 <circle cx="7.5" cy="9.5" r="1.8" fill={variationColor} />
                 <circle cx="4" cy="16" r="2.5" fill={variationColor} />
               </svg>
            </div>
            <div className="stats-card-info">
              <span className="stats-label">Cycle variation</span>
              <span className="stats-value">{calculatedVariation} days</span>
            </div>
          </div>
          <div className="stats-card-action">
             <div className="stats-divider" />
             {calculatedIsAtypical ? (
               <Tooltip>
                 <TooltipTrigger asChild>
                   <button 
                     type="button" 
                     onClick={() => canEdit && setIsSnapshotOpen(true)}
                     className={`stats-more-btn stats-more-btn--atypical ${canEdit ? 'cursor-pointer hover:bg-[var(--mf-hover)]' : 'cursor-default'}`}
                   >
                      <div className="flex items-center gap-2">
                        <Warning size={18} weight="fill" className="text-[#e25c00]" />
                        <span>Atypical</span>
                      </div>
                      {canEdit && <CaretRight size={16} />}
                   </button>
                 </TooltipTrigger>
                 <TooltipContent side="top" className="text-xs">
                   {canEdit 
                     ? "Your cycle length varies more than usual. Click to edit." 
                     : "Your partner's cycle length varies more than usual."}
                 </TooltipContent>
               </Tooltip>
             ) : (
               <Tooltip>
                 <TooltipTrigger asChild>
                   <button 
                     type="button" 
                     onClick={() => canEdit && setIsSnapshotOpen(true)}
                     className={`stats-more-btn stats-more-btn--regular ${canEdit ? 'cursor-pointer hover:bg-[var(--mf-hover)]' : 'cursor-default'}`}
                   >
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={18} weight="fill" className="text-teal-600" />
                        <span>Regular</span>
                      </div>
                      {canEdit && <CaretRight size={16} />}
                   </button>
                 </TooltipTrigger>
                 <TooltipContent side="top" className="text-xs">
                   {canEdit 
                     ? "Your cycle length is consistent and regular. Click to edit." 
                     : "Your partner's cycle length is consistent and regular."}
                 </TooltipContent>
               </Tooltip>
             )}
          </div>
        </div>

      </div>

      <SnapshotModal
        isOpen={isSnapshotOpen}
        onOpenChange={setIsSnapshotOpen}
        data={{
          lastPeriodStart: ownDashboard.lastPeriodStart,
          typicalCycleDays: calculatedTypical,
          cycleVariationDays: calculatedVariation,
          isAtypical: calculatedIsAtypical,
          cycleNotes: ownDashboard.cycleNotes
        }}
        update={updateDashboard}
        isSaving={isSaving}
      />
    </div>
  )
}


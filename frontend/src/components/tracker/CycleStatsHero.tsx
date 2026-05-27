import { Info, Warning, CaretRight } from '@phosphor-icons/react'
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useStore } from '@/store/useStore'

export function CycleStatsHero() {
  const { dashboard: data } = useStore()
  
  return (
    <div className="cycle-stats-hero">
      <div className="stats-banner">
        <img src="/images/mens.jpg" alt="" className="stats-banner-img" />
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
                 <path d="M18 3 a 15 15 0 0 1 0 30 a 15 15 0 0 1 0 -30" fill="none" stroke="#007e94" strokeWidth="4" strokeLinecap="round" strokeDasharray="75, 100" />
               </svg>
            </div>
            <div className="stats-card-info">
              <span className="stats-label">Cycle length</span>
              <span className="stats-value">{data.typicalCycleDays} days</span>
            </div>
          </div>
          <div className="stats-card-action">
             <div className="stats-divider" />
             <Tooltip>
               <TooltipTrigger asChild>
                 <button className="stats-more-btn">
                    <div className="flex items-center gap-2">
                      <Info size={18} weight="regular" />
                      <span>More info</span>
                    </div>
                    <CaretRight size={16} />
                 </button>
               </TooltipTrigger>
               <TooltipContent side="top" className="text-xs">
                 Average length of your cycle over the last 6 months.
               </TooltipContent>
             </Tooltip>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-card-main">
            <div className="stats-ring-box">
               <svg viewBox="0 0 36 36" className="stats-ring stats-ring--grey">
                 <path d="M18 3 a 15 15 0 0 1 0 30 a 15 15 0 0 1 0 -30" fill="none" stroke="currentColor" className="opacity-10" strokeWidth="4" />
                 {/* Trailing dots */}
                 <circle cx="12" cy="5.5" r="1.2" fill="#007e94" />
                 <circle cx="7.5" cy="9.5" r="1.8" fill="#007e94" />
                 <circle cx="4" cy="16" r="2.5" fill="#007e94" />
               </svg>
            </div>
            <div className="stats-card-info">
              <span className="stats-label">Cycle variation</span>
              <span className="stats-value">36 days</span>
            </div>
          </div>
          <div className="stats-card-action">
             <div className="stats-divider" />
             <Tooltip>
               <TooltipTrigger asChild>
                 <button className="stats-more-btn stats-more-btn--atypical">
                    <div className="flex items-center gap-2">
                      <Warning size={18} weight="fill" className="text-[#e25c00]" />
                      <span>Atypical</span>
                    </div>
                    <CaretRight size={16} />
                 </button>
               </TooltipTrigger>
               <TooltipContent side="top" className="text-xs">
                 Your cycle length varies more than usual. This can be normal but worth monitoring.
               </TooltipContent>
             </Tooltip>
          </div>
        </div>

      </div>
    </div>
  )
}

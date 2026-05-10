import { Info, Warning, CaretRight } from '@phosphor-icons/react'

export function CycleStatsHero() {
  return (
    <div className="cycle-stats-hero">
      <h2 className="stats-title">Cycle statistics</h2>
      <p className="stats-subtitle">Averages are based on your last 6 cycles.</p>

      <div className="stats-grid">
        <div className="stats-card">
          <div className="stats-card-main">
            <div className="stats-ring-box">
               <svg viewBox="0 0 36 36" className="stats-ring stats-ring--teal">
                 <path d="M18 3 a 15 15 0 0 1 0 30 a 15 15 0 0 1 0 -30" fill="none" stroke="#f0f0f0" strokeWidth="4" />
                 <path d="M18 3 a 15 15 0 0 1 0 30 a 15 15 0 0 1 0 -30" fill="none" stroke="#007e94" strokeWidth="4" strokeLinecap="round" strokeDasharray="75, 100" />
               </svg>
            </div>
            <div className="stats-card-info">
              <span className="stats-label">Cycle length</span>
              <span className="stats-value">35 days</span>
            </div>
          </div>
          <div className="stats-card-action">
             <div className="stats-divider" />
             <button className="stats-more-btn">
                <Info size={18} weight="regular" />
                <span>More info</span>
                <CaretRight size={16} />
             </button>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-card-main">
            <div className="stats-ring-box">
               <svg viewBox="0 0 36 36" className="stats-ring stats-ring--grey">
                 <path d="M18 3 a 15 15 0 0 1 0 30 a 15 15 0 0 1 0 -30" fill="none" stroke="#f0f0f0" strokeWidth="4" />
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
             <button className="stats-more-btn stats-more-btn--atypical">
                <Warning size={18} weight="fill" className="text-[#e25c00]" />
                <span>Atypical</span>
                <CaretRight size={16} />
             </button>
          </div>
        </div>

        <div className="stats-section-title">Period flow</div>

        <div className="stats-card">
          <div className="stats-card-main">
            <div className="stats-ring-box">
               <svg viewBox="0 0 36 36" className="stats-ring stats-ring--red">
                 <path d="M18 3 a 15 15 0 0 1 0 30 a 15 15 0 0 1 0 -30" fill="none" stroke="#f0f0f0" strokeWidth="4" />
                 <path d="M18 3 a 15 15 0 0 1 0 30 a 15 15 0 0 1 0 -30" fill="none" stroke="#d62f33" strokeWidth="4" strokeLinecap="round" strokeDasharray="15, 100" />
               </svg>
            </div>
            <div className="stats-card-info">
              <span className="stats-label">Average period length</span>
              <span className="stats-value">4 days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

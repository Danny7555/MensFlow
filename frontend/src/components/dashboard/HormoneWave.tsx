import { useState, useMemo, useEffect } from 'react'
import { Sparkle, Drop, Waveform } from '@phosphor-icons/react'

import { useStore } from '../../store/useStore'

const getDayInsight = (activeDay: number, cycleLen: number = 28) => {
  const menstrualEnd = 5
  const ovulationDay = Math.max(7, cycleLen - 14)
  const fertileStart = ovulationDay - 4
  const fertileEnd = ovulationDay + 2
  const midLutealEnd = cycleLen - 6

  if (activeDay <= menstrualEnd) {
    return {
      phase: `Menstrual Phase (Days 1-${menstrualEnd})`,
      estrogen: 'Low (19–83 pg/mL)',
      progesterone: 'Low (<0.1–0.8 ng/mL)',
      accentColor: '#f43f5e',
      description: 'Her body is shedding the uterine lining. Energy is naturally at its lowest.',
      supportTip: 'Offer a heating pad, prepare warm meals (soups/tea), and prioritize low-key nights in. Do not expect high physical activity.',
    }
  }
  if (activeDay <= fertileStart - 1) {
    return {
      phase: `Early Follicular Phase (Days ${menstrualEnd + 1}-${fertileStart - 1})`,
      estrogen: 'Rising (83–200 pg/mL)',
      progesterone: 'Low (0.1–0.8 ng/mL)',
      accentColor: '#0d9488',
      description: 'Estrogen is climbing, boosting her energy, mood, and cognitive sharpness.',
      supportTip: 'Great time to plan social activities, try new dates, or tackle collaborative projects. She is feeling more outgoing!',
    }
  }
  if (activeDay <= fertileEnd) {
    return {
      phase: `Ovulatory Phase / Fertile Window (Days ${fertileStart}-${fertileEnd})`,
      estrogen: 'Peak Surge (200–400 pg/mL)',
      progesterone: 'Low to Rising (0.1–1.5 ng/mL)',
      accentColor: '#0ea5e9',
      description: 'Estrogen reaches its highest peak. She is in her fertile window and likely feels high confidence.',
      supportTip: 'Compliment her, schedule special romantic date nights, and enjoy her peak social and physical energy window.',
    }
  }
  if (activeDay <= midLutealEnd) {
    return {
      phase: `Mid-Luteal Phase (Days ${fertileEnd + 1}-${midLutealEnd})`,
      estrogen: 'Moderate Second Peak (100–250 pg/mL)',
      progesterone: 'Peak Surge (2.0–25.0 ng/mL)',
      accentColor: '#d97706',
      description: 'Progesterone is peaking, which can make her feel calm, nesty, or slightly sleepy.',
      supportTip: 'Keep things cozy at home. Cook a comfort meal together. Understand if she prefers a quiet night over going out.',
    }
  }
  return {
    phase: `Late Luteal / PMS Phase (Days ${midLutealEnd + 1}-${cycleLen})`,
    estrogen: 'Falling (19–100 pg/mL)',
    progesterone: 'Falling (0.5–5.0 ng/mL)',
    accentColor: '#6b7280',
    description: 'Hormones drop sharply. This sudden shift often triggers fatigue, cravings, and mood fluctuations.',
    supportTip: 'Be extra patient. Bring her favorite snacks (like dark chocolate), handle chores without asking, and avoid starting heavy arguments.',
  }
}

export function HormoneWave() {
  const { dashboard: ownDashboard, partnerStatus, user } = useStore()

  const data = user?.role === 'partner' && partnerStatus?.paired && partnerStatus?.cycle
    ? partnerStatus.cycle
    : ownDashboard

  const cycleLen = data?.typicalCycleDays || 28
  const ovulationDay = Math.max(7, cycleLen - 14)

  const [activeDay, setActiveDay] = useState(14)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (data?.lastPeriodStart) {
        const safeLen = Math.max(1, cycleLen || 28)
        const start = new Date(`${data.lastPeriodStart}T12:00:00`)
        if (!Number.isNaN(+start)) {
          const days = Math.floor((Date.now() - +start) / 86400000)
          const m = ((days % safeLen) + safeLen) % safeLen
          setActiveDay(m + 1)
          return
        }
      }
      if (data?.phaseLabel) {
        const norm = data.phaseLabel.toLowerCase()
        if (norm.includes('menstrual')) {
          setActiveDay(3)
        } else if (norm.includes('follicular')) {
          setActiveDay(7)
        } else if (norm.includes('ovulat') || norm.includes('fertile')) {
          setActiveDay(Math.max(7, cycleLen - 14))
        } else if (norm.includes('luteal')) {
          setActiveDay(Math.round(cycleLen * 0.75))
        } else {
          setActiveDay(1)
        }
      } else {
        setActiveDay(1)
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [data?.lastPeriodStart, data?.phaseLabel, cycleLen])

  const dayInsight = useMemo(() => getDayInsight(activeDay, cycleLen), [activeDay, cycleLen])

  return (
    <div className="hormone-matrix-card">
      
      {/* Header Section */}
      <div className="hormone-header">
        <div className="hormone-badges">
          <div className="badge badge-pink">
            Hormone Matrix
          </div>
          <div className="badge badge-sparkle">
            <Sparkle size={12} weight="fill" />
            Interactive Timeline
          </div>
        </div>
        
        <h2 className="hormone-title">
          Estrogen & Progesterone Trends
        </h2>
        
        <div className="hormone-guide">
          <span className="guide-label">Hormone Guide:</span>
          <div className="guide-items">
            <div className="guide-item">
              <span className="guide-dot estrogen-dot"></span>
              <span className="guide-text">Estrogen drives energy, positive mood, and social confidence</span>
            </div>
            <div className="guide-item">
              <span className="guide-dot progesterone-dot"></span>
              <span className="guide-text">Progesterone promotes relaxation and calm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="timeline-section">
        <div className="timeline-header">
          <div className="timeline-position">
            <span className="position-label">Timeline Position</span>
            <span className="position-value">
              Day <span className="current-day">{activeDay}</span> of {cycleLen}
            </span>
          </div>
          
          <div className="phase-indicator" style={{ backgroundColor: `${dayInsight.accentColor}15`, color: dayInsight.accentColor }}>
            {dayInsight.phase}
          </div>
        </div>
        
        {/* Timeline Slider */}
        <div className="timeline-slider">
          <input
            type="range"
            min="1"
            max={cycleLen}
            value={activeDay}
            onChange={(e) => setActiveDay(parseInt(e.target.value))}
            className="hormone-slider"
            style={{
              background: `linear-gradient(to right, ${dayInsight.accentColor}40 0%, ${dayInsight.accentColor}40 ${(activeDay / cycleLen) * 100}%, #e5e7eb ${(activeDay / cycleLen) * 100}%, #e5e7eb 100%)`
            }}
          />
          
          <div className="timeline-markers">
            <div className="marker">
              <span className="marker-label">Day 1</span>
              <div className="marker-dot"></div>
            </div>
            <div className="marker">
              <span className="marker-label">Day {Math.round(cycleLen * 0.25)}</span>
              <div className="marker-dot"></div>
            </div>
            <div className="marker marker-highlight">
              <span className="marker-label">Day {ovulationDay} (Ovulation)</span>
              <div className="marker-dot ovulation-dot"></div>
            </div>
            <div className="marker">
              <span className="marker-label">Day {Math.round(cycleLen * 0.75)}</span>
              <div className="marker-dot"></div>
            </div>
            <div className="marker">
              <span className="marker-label">Day {cycleLen}</span>
              <div className="marker-dot"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Hormone Levels Section */}
      <div className="hormone-levels-section">
        <div className="hormone-card">
          <div className="hormone-header">
            <div className="hormone-icon estrogen-icon">
              <Drop size={16} weight="fill" />
            </div>
            <div className="hormone-info">
              <h3 className="hormone-name">Estrogen Level</h3>
              <div className="hormone-value">{dayInsight.estrogen}</div>
            </div>
          </div>
          
          <div className="hormone-visual">
            <div className="hormone-bar">
              <div 
                className="hormone-fill estrogen-fill"
                style={{ 
                  width: `${getHormonePercentage(dayInsight.estrogen)}%`,
                  backgroundColor: dayInsight.accentColor
                }}
              ></div>
            </div>
            <div className="hormone-scale">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
          </div>
        </div>
        
        <div className="hormone-card">
          <div className="hormone-header">
            <div className="hormone-icon progesterone-icon">
              <Waveform size={16} weight="bold" />
            </div>
            <div className="hormone-info">
              <h3 className="hormone-name">Progesterone Level</h3>
              <div className="hormone-value">{dayInsight.progesterone}</div>
            </div>
          </div>
          
          <div className="hormone-visual">
            <div className="hormone-bar">
              <div 
                className="hormone-fill progesterone-fill"
                style={{ 
                  width: `${getHormonePercentage(dayInsight.progesterone)}%`,
                  backgroundColor: dayInsight.accentColor
                }}
              ></div>
            </div>
            <div className="hormone-scale">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
          </div>
        </div>
      </div>

      {/* Phase Insight Section */}
      <div className="phase-insight-section">
        <div className="phase-card">
          <h3 className="phase-title">Phase Insight</h3>
          <p className="phase-description">{dayInsight.description}</p>
        </div>
        
        <div className="support-card">
          <h3 className="support-title">Empathy Support Guide</h3>
          <div className="support-content">
            <div className="support-icon">💝</div>
            <p className="support-tip">{dayInsight.supportTip}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to convert hormone level text to percentage
function getHormonePercentage(levelText: string): number {
  const lower = levelText.toLowerCase()
  if (lower.includes('low') || lower.includes('falling')) return 25
  if (lower.includes('rising') || lower.includes('moderate')) return 50
  if (lower.includes('peak') || lower.includes('high')) return 75
  return 33
}
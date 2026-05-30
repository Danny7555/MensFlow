import { useState, useMemo, useEffect } from 'react'
import { Sparkle } from '@phosphor-icons/react'
import { BiologicalSnapshot } from './BiologicalSnapshot'
import { EmpathySupportGuide } from './EmpathySupportGuide'
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
      if (!data?.lastPeriodStart) {
        if (data?.phaseLabel) {
          const norm = data.phaseLabel.toLowerCase()
          if (norm.includes('menstrual')) {
            setActiveDay(3)
          } else if (norm.includes('follicular')) {
            setActiveDay(7)
          } else if (norm.includes('ovulat') || norm.includes('fertile')) {
            setActiveDay(14)
          } else if (norm.includes('luteal')) {
            setActiveDay(20)
          } else {
            setActiveDay(1)
          }
        } else {
          setActiveDay(1)
        }
        return
      }
      const start = new Date(`${data.lastPeriodStart}T12:00:00`)
      if (!Number.isNaN(+start)) {
        const days = Math.floor((Date.now() - +start) / 86400000)
        const m = ((days % cycleLen) + cycleLen) % cycleLen
        setActiveDay(m + 1)
      } else {
        setActiveDay(1)
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [data?.lastPeriodStart, data?.phaseLabel, cycleLen])

  // Phase & Insight information
  const dayInsight = useMemo(() => getDayInsight(activeDay, cycleLen), [activeDay, cycleLen])

  return (
    <div className="flo-card p-4 md:p-5 relative overflow-hidden group transition-all duration-500 mb-6 border border-[var(--mf-border)]/60 !shadow-none">
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20">
              <span className="text-[9px] md:text-[10px] font-medium text-pink-600 dark:text-pink-400 uppercase tracking-[0.15em]">
                Hormone Matrix
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--mf-hover)] border border-[var(--mf-border)]">
              <Sparkle size={10} weight="fill" className="text-amber-500" />
              <span className="text-[9px] md:text-[10px] text-[var(--mf-muted)] font-medium">Interactive Timeline</span>
            </div>
          </div>
          
          <h3 className="text-lg md:text-xl font-medium text-[var(--mf-text-strong)] tracking-tight leading-none mb-2">
            Estrogen & Progesterone Trends
          </h3>
          <p className="text-[10.5px] md:text-[11px] text-[var(--mf-muted)] max-w-xl leading-relaxed font-normal">
            <span className="font-medium text-[var(--mf-text-strong)]">Hormone Guide:</span> Estrogen drives physical energy, positive mood, and social confidence. Progesterone promotes physical relaxation and calm, but its drop can trigger premenstrual sensitivity.
          </p>
        </div>
      </div>

      {/* Scrub Slider */}
      <div className="relative z-10 flex flex-col gap-2.5 mb-5 px-1">
        <style>{`
          .hormone-range-input {
            -webkit-appearance: none;
            height: 4px;
            background: ${dayInsight.accentColor}25;
            border-radius: 10px;
          }
          .hormone-range-input::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 10px;
            background: #ffffff;
            border: 2px solid ${dayInsight.accentColor};
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .hormone-range-input::-webkit-slider-thumb:hover {
            background: ${dayInsight.accentColor}10;
          }
          .hormone-range-input::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 10px;
            background: #ffffff;
            border: 2px solid ${dayInsight.accentColor};
            cursor: pointer;
          }
        `}</style>
        
        <div className="flex justify-between items-end mb-1">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] md:text-[10px] font-medium text-[var(--mf-muted)] uppercase tracking-widest">Timeline Position</span>
            <span className="text-xs md:text-sm font-medium text-[var(--mf-text-strong)] flex items-center gap-2">
              Day {activeDay} of {cycleLen}
            </span>
          </div>
          
          <div
            className="px-3 md:px-4 py-1 md:py-1.5 rounded-xl border transition-all duration-500 flex items-center gap-2"
            style={{
              color: dayInsight.accentColor,
              borderColor: `${dayInsight.accentColor}25`,
              backgroundColor: `${dayInsight.accentColor}08`
            }}
          >
            <span className="text-[10px] md:text-[11px] font-medium tracking-tight uppercase">
              {dayInsight.phase}
            </span>
          </div>
        </div>
        
        <div className="relative pt-2">
          <input
            type="range"
            min="1"
            max={cycleLen}
            value={activeDay}
            onChange={(e) => setActiveDay(parseInt(e.target.value))}
            className="hormone-range-input w-full cursor-pointer focus:outline-none"
          />
        </div>
        
        <div className="flex justify-between text-[10px] text-[var(--mf-muted)] px-1 font-normal opacity-60">
          <span>Day 1</span>
          <span>Day {Math.round(cycleLen * 0.25)}</span>
          <span className="text-[var(--mf-text-strong)] font-medium">Day {ovulationDay} (Ovulation)</span>
          <span>Day {Math.round(cycleLen * 0.75)}</span>
          <span>Day {cycleLen}</span>
        </div>
      </div>

      {/* Info Output Dashboard */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-0 rounded-[16px] bg-[var(--mf-card)] border border-[var(--mf-border)] overflow-hidden">
        <div className="p-3 md:p-4">
          <BiologicalSnapshot
            estrogen={dayInsight.estrogen}
            progesterone={dayInsight.progesterone}
            description={dayInsight.description}
          />
        </div>
        <div className="p-3 md:p-4 bg-[var(--mf-hover)]/[0.03]">
          <EmpathySupportGuide
            supportTip={dayInsight.supportTip}
          />
        </div>
      </div>
    </div>
  )
}

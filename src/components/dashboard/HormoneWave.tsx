import { useState, useMemo } from 'react'
import { Sparkle } from '@phosphor-icons/react'
import { HormoneLegend } from './HormoneLegend'
import { BiologicalSnapshot } from './BiologicalSnapshot'
import { EmpathySupportGuide } from './EmpathySupportGuide'
import { HormoneWaveChart } from './HormoneWaveChart'

const getDayInsight = (activeDay: number) => {
  if (activeDay <= 5) {
    return {
      phase: 'Menstrual Phase (Days 1-5)',
      estrogen: 'Low',
      progesterone: 'Low',
      accentColor: '#f43f5e',
      description: 'Her body is shedding the uterine lining. Energy is naturally at its lowest.',
      supportTip: 'Offer a heating pad, prepare warm meals (soups/tea), and prioritize low-key nights in. Do not expect high physical activity.',
    }
  }
  if (activeDay <= 9) {
    return {
      phase: 'Early Follicular Phase (Days 6-9)',
      estrogen: 'Rising steadily',
      progesterone: 'Low',
      accentColor: '#0d9488',
      description: 'Estrogen is climbing, boosting her energy, mood, and cognitive sharpness.',
      supportTip: 'Great time to plan social activities, try new dates, or tackle collaborative projects. She is feeling more outgoing!',
    }
  }
  if (activeDay <= 16) {
    return {
      phase: 'Ovulatory Phase / Fertile Window (Days 10-16)',
      estrogen: 'Peaking high',
      progesterone: 'Low but starting to rise',
      accentColor: '#0ea5e9',
      description: 'Estrogen reaches its highest peak. She is in her fertile window and likely feels high confidence.',
      supportTip: 'Compliment her, schedule special romantic date nights, and enjoy her peak social and physical energy window.',
    }
  }
  if (activeDay <= 22) {
    return {
      phase: 'Mid-Luteal Phase (Days 17-22)',
      estrogen: 'Moderate second peak',
      progesterone: 'Peaking high',
      accentColor: '#d97706',
      description: 'Progesterone is peaking, which can make her feel calm, nesty, or slightly sleepy.',
      supportTip: 'Keep things cozy at home. Cook a comfort meal together. Understand if she prefers a quiet night over going out.',
    }
  }
  return {
    phase: 'Late Luteal / PMS Phase (Days 23-28)',
    estrogen: 'Crashing low',
    progesterone: 'Crashing low',
    accentColor: '#6b7280',
    description: 'Hormones drop sharply. This sudden shift often triggers fatigue, cravings, and mood fluctuations.',
    supportTip: 'Be extra patient. Bring her favorite snacks (like dark chocolate), handle chores without asking, and avoid starting heavy arguments.',
  }
}

export function HormoneWave() {
  const [activeDay, setActiveDay] = useState(14)

  // Phase & Insight information
  const dayInsight = useMemo(() => getDayInsight(activeDay), [activeDay])

  return (
    <div className="flo-card flo-card--prominent p-6 relative overflow-hidden group transition-all duration-500 mb-8">

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="w-fit text-[9px] font-normal uppercase tracking-[0.12em] bg-pink-500 text-white px-3 py-1.5 rounded-full">
              HORMONE MATRIX
            </span>
            <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-500 font-normal">
              <Sparkle size={12} weight="fill" />
              <span>Interactive Wave</span>
            </div>
          </div>
          <h3 className="text-xl font-normal text-[var(--mf-text-strong)] tracking-tight">
            Estrogen & Progesterone Trends
          </h3>
          <p className="text-[11px] text-[var(--mf-muted)] mt-1.5 max-w-xl leading-relaxed">
            Hormone Guide: Estrogen drives physical energy, positive mood, and social confidence. Progesterone promotes physical relaxation and calm, but its drop can trigger premenstrual sensitivity.
          </p>
        </div>

        {/* Legend */}
        <HormoneLegend />
      </div>

      {/* SVG Waves Container */}
      <HormoneWaveChart
        activeDay={activeDay}
        setActiveDay={setActiveDay}
        accentColor={dayInsight.accentColor}
      />

      {/* Scrub Slider */}
      <div className="relative z-10 flex flex-col gap-2 mb-6">
        <style>{`
          .hormone-range-input::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #ffffff;
            border: 3px solid ${dayInsight.accentColor};
            cursor: pointer;
            transition: transform 0.1s ease, border-color 0.2s ease;
          }
          .hormone-range-input::-webkit-slider-thumb:hover {
            transform: scale(1.15);
          }
          .hormone-range-input::-webkit-slider-thumb:active {
            transform: scale(0.95);
          }
          .hormone-range-input::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #ffffff;
            border: 3px solid ${dayInsight.accentColor};
            cursor: pointer;
            transition: transform 0.1s ease, border-color 0.2s ease;
          }
          .hormone-range-input::-moz-range-thumb:hover {
            transform: scale(1.15);
          }
          .hormone-range-input::-moz-range-thumb:active {
            transform: scale(0.95);
          }
        `}</style>
        <div className="flex justify-between items-center text-xs text-[var(--mf-muted)] mb-1">
          <span className="font-normal text-[var(--mf-text-strong)] flex items-center gap-1.5">
            <span className="inline-block size-1.5 rounded-full" style={{ backgroundColor: dayInsight.accentColor }} />
            Day {activeDay} of 28
          </span>
          <span
            className="text-[11px] font-normal px-2.5 py-0.5 rounded-full border transition-all duration-300"
            style={{
              color: dayInsight.accentColor,
              borderColor: `${dayInsight.accentColor}30`,
              backgroundColor: `${dayInsight.accentColor}10`
            }}
          >
            {dayInsight.phase}
          </span>
        </div>
        <div className="relative">
          <input
            type="range"
            min="1"
            max="28"
            value={activeDay}
            onChange={(e) => setActiveDay(parseInt(e.target.value))}
            className="hormone-range-input w-full h-1.5 bg-[var(--mf-border)] rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--mf-accent)]"
          />
        </div>
        <div className="flex justify-between text-[9px] text-[var(--mf-muted)] px-1 mt-0.5 font-normal select-none pointer-events-none opacity-80">
          <span>Day 1</span>
          <span>Day 7</span>
          <span>Day 14 (Ovulation)</span>
          <span>Day 21</span>
          <span>Day 28</span>
        </div>
      </div>

      {/* Info Output Dashboard */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-3xl bg-[var(--mf-composer-bg)]/90 border border-[var(--mf-border)]">
        <BiologicalSnapshot
          estrogen={dayInsight.estrogen}
          progesterone={dayInsight.progesterone}
          description={dayInsight.description}
        />
        <EmpathySupportGuide
          supportTip={dayInsight.supportTip}
        />
      </div>
    </div>
  )
}

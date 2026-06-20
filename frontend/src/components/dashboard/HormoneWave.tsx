import { useState, useMemo, useEffect } from 'react'
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
      estrogen: { label: 'Low', detail: 'At its lowest — rest & recover' },
      progesterone: { label: 'Low', detail: 'Bottomed out' },
      accentColor: '#f43f5e',
      description: 'Your body is shedding the uterine lining. Energy is naturally at its lowest right now.',
      supportTip: 'Use a heating pad, eat warm foods (soup, tea), and keep evenings low-key. No need to push yourself.',
    }
  }
  if (activeDay <= fertileStart - 1) {
    return {
      phase: `Early Follicular Phase (Days ${menstrualEnd + 1}-${fertileStart - 1})`,
      estrogen: { label: 'Rising', detail: 'Energy & mood lifting' },
      progesterone: { label: 'Low', detail: 'Stays low' },
      accentColor: '#0d9488',
      description: 'Estrogen is climbing — your energy, mood, and focus are coming back up.',
      supportTip: 'Good time for social plans, trying new things, or starting projects. You are feeling more outgoing!',
    }
  }
  if (activeDay <= fertileEnd) {
    return {
      phase: `Ovulatory Phase / Fertile Window (Days ${fertileStart}-${fertileEnd})`,
      estrogen: { label: 'Peak', detail: 'Highest of the month' },
      progesterone: { label: 'Starting to Rise', detail: 'Gradually increasing' },
      accentColor: '#0ea5e9',
      description: 'Estrogen peaks — you are in your fertile window with high confidence and energy.',
      supportTip: 'Schedule important conversations or dates. Enjoy your peak social and physical energy.',
    }
  }
  if (activeDay <= midLutealEnd) {
    return {
      phase: `Mid-Luteal Phase (Days ${fertileEnd + 1}-${midLutealEnd})`,
      estrogen: { label: 'Moderate', detail: 'Stable second wave' },
      progesterone: { label: 'Peak', detail: 'Highest of the month' },
      accentColor: '#d97706',
      description: 'Progesterone peaks — you may feel calm, sleepy, or want to nest at home.',
      supportTip: 'Keep things cozy. Cook a comfort meal together. Quiet nights in are totally fine.',
    }
  }
  return {
    phase: `Late Luteal / PMS Phase (Days ${midLutealEnd + 1}-${cycleLen})`,
    estrogen: { label: 'Falling', detail: 'Dropping quickly' },
    progesterone: { label: 'Falling', detail: 'Dropping quickly' },
    accentColor: '#6b7280',
    description: 'Both hormones drop sharply — this sudden shift can bring fatigue, cravings, and mood changes.',
    supportTip: 'Be patient with yourself. Rest, eat what you crave, and avoid stressful situations where possible.',
  }
}

function Bar({ label, detail, level, color }: {
  label: string
  detail: string
  level: 'low' | 'medium' | 'high' | 'peak'
  color: string
}) {
  const pct = level === 'low' ? 20 : level === 'medium' ? 50 : 80
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <span className="text-sm font-semibold text-[var(--mf-text-strong)]">{label}</span>
        <span className="text-xs text-muted-foreground">{detail}</span>
      </div>
      <div className="h-3 bg-muted/40 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
        <span>Low</span>
        <span>Med</span>
        <span>High</span>
      </div>
    </div>
  )
}

export function HormoneWave() {
  const { dashboard: ownDashboard, partnerStatus, user } = useStore()

  const data = user?.role === 'partner' && partnerStatus?.paired && partnerStatus?.cycle
    ? partnerStatus.cycle
    : ownDashboard

  const cycleLen = data?.typicalCycleDays || 28

  const [activeDay, setActiveDay] = useState(14)

  useEffect(() => {
    const timer = setTimeout(() => {
      let nextDay = 1
      if (data?.lastPeriodStart) {
        const safeLen = Math.max(1, cycleLen || 28)
        const start = new Date(`${data.lastPeriodStart}T12:00:00`)
        if (!Number.isNaN(+start)) {
          const days = Math.floor((Date.now() - +start) / 86400000)
          const m = ((days % safeLen) + safeLen) % safeLen
          nextDay = m + 1
        }
      } else if (data?.phaseLabel) {
        const norm = data.phaseLabel.toLowerCase()
        if (norm.includes('menstrual')) nextDay = 3
        else if (norm.includes('follicular')) nextDay = 7
        else if (norm.includes('ovulat') || norm.includes('fertile')) nextDay = Math.max(7, cycleLen - 14)
        else if (norm.includes('luteal')) nextDay = Math.round(cycleLen * 0.75)
      }
      setActiveDay(nextDay)
    }, 0)
    return () => clearTimeout(timer)
  }, [data?.lastPeriodStart, data?.phaseLabel, cycleLen])

  const dayInsight = useMemo(() => getDayInsight(activeDay, cycleLen), [activeDay, cycleLen])

  return (
    <div className="space-y-5 p-5 bg-card rounded-2xl border border-border">
      {/* Title + Phase */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[var(--mf-text-strong)]">Your Cycle Today</h2>
        <span className="text-xs font-medium px-3 py-1 rounded-full shrink-0" style={{ backgroundColor: `${dayInsight.accentColor}15`, color: dayInsight.accentColor }}>
          {dayInsight.phase}
        </span>
      </div>

      {/* Timeline Slider */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-muted-foreground font-medium">Day {activeDay} of {cycleLen}</span>
          <span className="text-[11px] text-muted-foreground">Drag to explore</span>
        </div>
        <input
          type="range"
          min="1"
          max={cycleLen}
          value={activeDay}
          onChange={(e) => setActiveDay(parseInt(e.target.value))}
          className="hormone-slider w-full"
          style={{
            background: `linear-gradient(to right, ${dayInsight.accentColor}40 0%, ${dayInsight.accentColor}40 ${(activeDay / cycleLen) * 100}%, #e5e7eb ${(activeDay / cycleLen) * 100}%, #e5e7eb 100%)`
          }}
        />
      </div>

      {/* Hormone Bars */}
      <div className="space-y-3">
        <Bar label="Estrogen" detail={dayInsight.estrogen.detail} level={dayInsight.estrogen.label === 'Low' ? 'low' : dayInsight.estrogen.label === 'Rising' || dayInsight.estrogen.label === 'Moderate' ? 'medium' : 'peak'} color={dayInsight.accentColor} />
        <Bar label="Progesterone" detail={dayInsight.progesterone.detail} level={dayInsight.progesterone.label === 'Low' || dayInsight.progesterone.label === 'Bottomed out' ? 'low' : dayInsight.progesterone.label === 'Starting to Rise' ? 'medium' : 'peak'} color={dayInsight.accentColor} />
      </div>

      {/* What this means */}
      <div className="bg-muted/30 rounded-xl p-4 space-y-2">
        <p className="text-sm leading-relaxed text-[var(--mf-text)]">{dayInsight.description}</p>
        <div className="flex gap-2.5 pt-1">
          <span className="text-lg shrink-0 leading-none" style={{ lineHeight: 1 }}>💡</span>
          <p className="text-sm leading-relaxed text-[var(--mf-text-strong)] font-medium">{dayInsight.supportTip}</p>
        </div>
      </div>
    </div>
  )
}

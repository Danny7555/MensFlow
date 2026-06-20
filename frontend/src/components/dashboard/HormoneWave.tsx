import { useState, useMemo, useEffect } from 'react'
import { useStore } from '../../store/useStore'

const phaseIcons: Record<string, string> = {
  menstrual: '🌸',
  follicular: '🌱',
  ovulatory: '🌟',
  luteal: '🌙',
  premenstrual: '🧘',
}

const getDayInsight = (activeDay: number, cycleLen: number = 28) => {
  const menstrualEnd = 5
  const ovulationDay = Math.max(7, cycleLen - 14)
  const fertileStart = ovulationDay - 4
  const fertileEnd = ovulationDay + 2
  const midLutealEnd = cycleLen - 6

  if (activeDay <= menstrualEnd) {
    return {
      key: 'menstrual',
      phase: `Your Period`,
      estrogen: { label: 'Low', detail: 'At its lowest' },
      progesterone: { label: 'Low', detail: 'Bottomed out' },
      accentColor: '#f43f5e',
      description: 'Your body is shedding the uterine lining. Energy is naturally at its lowest right now.',
      supportTip: 'Rest up — warm teas, a heating pad, and early nights. You deserve the break.',
    }
  }
  if (activeDay <= fertileStart - 1) {
    return {
      key: 'follicular',
      phase: `Follicular`,
      estrogen: { label: 'Rising', detail: 'Energy lifting' },
      progesterone: { label: 'Low', detail: 'Stays low' },
      accentColor: '#0d9488',
      description: 'Estrogen is climbing — you are getting your spark back.',
      supportTip: 'Great time to try something new, make plans, or start that project you have been thinking about.',
    }
  }
  if (activeDay <= fertileEnd) {
    return {
      key: 'ovulatory',
      phase: `Ovulation`,
      estrogen: { label: 'Peak', detail: 'Highest all month' },
      progesterone: { label: 'Rising', detail: 'Gradually climbing' },
      accentColor: '#0ea5e9',
      description: 'Estrogen peaks — confidence and energy are at their monthly high.',
      supportTip: 'Schedule important chats, date nights, or anything that needs your A-game.',
    }
  }
  if (activeDay <= midLutealEnd) {
    return {
      key: 'luteal',
      phase: `Luteal`,
      estrogen: { label: 'Moderate', detail: 'Stable' },
      progesterone: { label: 'Peak', detail: 'Highest all month' },
      accentColor: '#d97706',
      description: 'Progesterone peaks — you may feel calm, sleepy, or want to nest.',
      supportTip: 'Keep it cozy — comfort food, a good show, and quiet nights are perfect.',
    }
  }
  return {
    key: 'premenstrual',
    phase: `Pre-Menstrual`,
    estrogen: { label: 'Falling', detail: 'Dropping quickly' },
    progesterone: { label: 'Falling', detail: 'Dropping quickly' },
    accentColor: '#6b7280',
    description: 'Both hormones drop sharply — fatigue, cravings, and mood shifts are totally normal.',
    supportTip: 'Be gentle with yourself. Eat what sounds good, rest extra, and skip what you can.',
  }
}

function Bar({ label, detail, level, color }: {
  label: string
  detail: string
  level: 'low' | 'medium' | 'high' | 'peak'
  color: string
}) {
  const pct = level === 'low' ? 22 : level === 'medium' ? 50 : 82
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <span className="text-sm font-semibold text-[var(--mf-text-strong)]">{label}</span>
        <span className="text-xs text-muted-foreground">{detail}</span>
      </div>
      <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
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

  const icon = phaseIcons[dayInsight.key]

  const createSliderBg = (val: number, max: number, color: string) =>
    `linear-gradient(to right, ${color}30 0%, ${color}30 ${(val / max) * 100}%, var(--mf-border) ${(val / max) * 100}%, var(--mf-border) 100%)`

  return (
    <div className="space-y-5 p-5 bg-card rounded-2xl border border-border">
      {/* Title + Phase */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[var(--mf-text-strong)]">
          <span className="mr-1.5">{icon}</span>
          Your Cycle Today
        </h2>
        <span
          className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
          style={{ backgroundColor: `${dayInsight.accentColor}14`, color: dayInsight.accentColor }}
        >
          {dayInsight.phase}
        </span>
      </div>

      {/* Timeline Slider */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground font-medium">Day {activeDay}&thinsp;of&thinsp;{cycleLen}</span>
          <span className="text-[11px] text-muted-foreground">Drag to explore</span>
        </div>
        <input
          type="range"
          min="1"
          max={cycleLen}
          value={activeDay}
          onChange={(e) => setActiveDay(parseInt(e.target.value))}
          className="hormone-slider w-full"
          style={{ background: createSliderBg(activeDay, cycleLen, dayInsight.accentColor) }}
        />
      </div>

      {/* Hormone Bars */}
      <div className="space-y-4">
        <Bar label="Estrogen" detail={dayInsight.estrogen.detail}
          level={dayInsight.estrogen.label === 'Low' ? 'low' : dayInsight.estrogen.label === 'Rising' || dayInsight.estrogen.label === 'Moderate' ? 'medium' : 'peak'}
          color={dayInsight.accentColor} />
        <Bar label="Progesterone" detail={dayInsight.progesterone.detail}
          level={dayInsight.progesterone.label === 'Low' || dayInsight.progesterone.label === 'Bottomed out' ? 'low' : dayInsight.progesterone.label === 'Starting to Rise' ? 'medium' : 'peak'}
          color={dayInsight.accentColor} />
      </div>

      {/* What this means */}
      <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-3">
        <p className="text-sm leading-relaxed text-[var(--mf-text)]">{dayInsight.description}</p>
        <p className="text-sm leading-relaxed text-[var(--mf-text-strong)]">{dayInsight.supportTip}</p>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { 
  Pill, Pulse, Drop, DropHalf, DropSimple, 
  Smiley, SmileyWink, SmileyXEyes, SmileySad, Fire, 
  Brain, Waves, Moon, HandHeart, Sparkle,
  CalendarBlank 
} from '@phosphor-icons/react'
import { cn } from '../lib/utils'
import { SYMPTOM_DEFS } from '../data/symptomsData'
import type { SymptomCategory } from '../data/symptomsData'
import { SymptomsChart } from '../components/SymptomsChart'

const SYMPTOM_ICONS: Record<string, React.ElementType> = {
  'flow-light': DropSimple,
  'flow-medium': DropHalf,
  'flow-heavy': Drop,
  'mood-calm': Smiley,
  'mood-happy': SmileyWink,
  'mood-anxious': SmileyXEyes,
  'mood-sad': SmileySad,
  'mood-irritable': Fire,
  'phys-cramps': Pulse,
  'phys-headache': Brain,
  'phys-bloating': Waves,
  'phys-fatigue': Moon,
  'phys-tender': HandHeart,
  'phys-acne': Sparkle,
}

function SymptomCategoryList({ 
  category, 
  IconComponent, 
  activeSymptoms, 
  toggleSymptom 
}: { 
  category: SymptomCategory, 
  IconComponent: React.ElementType, 
  activeSymptoms: Set<string>, 
  toggleSymptom: (id: string) => void 
}) {
  const items = SYMPTOM_DEFS.filter((s) => s.category === category)
  if (items.length === 0) return null

  return (
    <div className="dash-panel p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium tracking-tight text-foreground flex items-center gap-2">
          <IconComponent size={20} className="text-[var(--mf-accent)]" />
          {category}
        </h3>
        <span className="text-[0.65rem] uppercase tracking-widest text-muted-foreground font-medium">
          {items.length} options
        </span>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {items.map((symptom) => {
          const isActive = activeSymptoms.has(symptom.id)
          return (
            <button
              key={symptom.id}
              type="button"
              onClick={() => toggleSymptom(symptom.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-300 cursor-pointer",
                isActive
                  ? "bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] border-[var(--mf-accent-border)] shadow-sm scale-[1.02]"
                  : "bg-card text-muted-foreground border-border hover:border-[var(--mf-accent-border)] hover:text-foreground"
              )}
            >
              {SYMPTOM_ICONS[symptom.id] && (() => {
                const Icon = SYMPTOM_ICONS[symptom.id]
                return (
                  <span className={cn(isActive ? "text-[var(--mf-accent)]" : "text-muted-foreground/60")}>
                    <Icon size={16} />
                  </span>
                )
              })()}
              {symptom.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function SymptomsView() {
  // purely visual local state for today's logs
  const [activeSymptoms, setActiveSymptoms] = useState<Set<string>>(new Set())

  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])

  const todayStr = mounted 
    ? new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
    : ''

  const toggleSymptom = (id: string) => {
    const next = new Set(activeSymptoms)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setActiveSymptoms(next)
  }

  return (
    <div className="flex-1 w-full max-w-[1200px] mx-auto p-6 space-y-10 animate-in fade-in duration-700">
      <header className="dash-header">
        <div className="dash-header-left">
          <img src="/images/girl.png" alt="" className="dash-avatar" />
          <div>
            <p className="dash-kicker">Tracking</p>
            <h1 className="dash-title">Daily symptoms</h1>
          </div>
        </div>
        <div className="dash-header-meta">
          <span className="dash-pill">
            <CalendarBlank size={16} aria-hidden />
            Today, {todayStr}
          </span>
        </div>
        <p className="dash-sub">
          Log how you feel to discover patterns 
        </p>
      </header>

      <section aria-labelledby="today-log-title" className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 id="today-log-title" className="text-lg font-medium tracking-tight text-foreground">
            Current Status
          </h2>
          <p className="text-xs text-muted-foreground">
            {activeSymptoms.size} symptoms logged
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SymptomCategoryList category="Physical" IconComponent={Pulse} activeSymptoms={activeSymptoms} toggleSymptom={toggleSymptom} />
          <SymptomCategoryList category="Mood" IconComponent={Pill} activeSymptoms={activeSymptoms} toggleSymptom={toggleSymptom} />
          <SymptomCategoryList category="Flow" IconComponent={Drop} activeSymptoms={activeSymptoms} toggleSymptom={toggleSymptom} />
        </div>
      </section>

      <section aria-labelledby="trends-title" className="space-y-6 pt-4">
        <h2 id="trends-title" className="text-lg font-medium tracking-tight text-foreground">
          Historical Trends
        </h2>
        <div className="dash-panel p-2 sm:p-8 bg-card/30">
          <SymptomsChart />
        </div>
      </section>
    </div>
  )
}

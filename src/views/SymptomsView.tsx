import { useState } from 'react'
import { Pill, Pulse, Drop, Smiley, SmileyWink, SmileyXEyes, SmileySad, Fire } from '@phosphor-icons/react'
import { cn } from '../lib/utils'
import { SYMPTOM_DEFS } from '../data/symptomsData'
import type { SymptomCategory } from '../data/symptomsData'
import { SymptomsChart } from '../components/SymptomsChart'

const SYMPTOM_ICONS: Record<string, any> = {
  'mood-calm': Smiley,
  'mood-happy': SmileyWink,
  'mood-anxious': SmileyXEyes,
  'mood-sad': SmileySad,
  'mood-irritable': Fire,
}

function SymptomCategoryList({ 
  category, 
  IconComponent, 
  activeSymptoms, 
  toggleSymptom 
}: { 
  category: SymptomCategory, 
  IconComponent: any, 
  activeSymptoms: Set<string>, 
  toggleSymptom: (id: string) => void 
}) {
  const items = SYMPTOM_DEFS.filter((s) => s.category === category)
  if (items.length === 0) return null

  return (
    <div className="dash-panel p-6 flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
        <IconComponent size={18} weight="bold" className="text-muted-foreground" />
        {category}
      </h3>
      <div className="flex flex-wrap gap-2">
        {items.map((symptom) => {
          const isActive = activeSymptoms.has(symptom.id)
          return (
            <button
              key={symptom.id}
              type="button"
              onClick={() => toggleSymptom(symptom.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 cursor-pointer",
                isActive
                  ? "bg-[#2ebcc5] text-white border-[#2ebcc5] shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:border-foreground hover:text-foreground"
              )}
            >
              {SYMPTOM_ICONS[symptom.id] && (() => {
                const Icon = SYMPTOM_ICONS[symptom.id]
                return (
                  <span className={isActive ? "text-white" : "text-muted-foreground"}>
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

  const toggleSymptom = (id: string) => {
    const next = new Set(activeSymptoms)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setActiveSymptoms(next)
  }

  return (
    <div className="flex-1 w-full max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
      <header className="page-hero mt-2">
        <div className="page-hero-icon">
          <Pulse size={26} weight="duotone" aria-hidden />
        </div>
        <h1 className="page-hero-title">Symptoms</h1>
        <p className="page-hero-desc">
          Daily symptom logging with gentle charts to visualize your well-being.
        </p>
      </header>

      <section aria-labelledby="today-log-title" className="space-y-4">
        <h2 id="today-log-title" className="text-xl font-semibold tracking-tight text-foreground">
          Log for Today
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SymptomCategoryList category="Physical" IconComponent={Pulse} activeSymptoms={activeSymptoms} toggleSymptom={toggleSymptom} />
          <SymptomCategoryList category="Mood" IconComponent={Pill} activeSymptoms={activeSymptoms} toggleSymptom={toggleSymptom} />
          <SymptomCategoryList category="Flow" IconComponent={Drop} activeSymptoms={activeSymptoms} toggleSymptom={toggleSymptom} />
        </div>
      </section>

      <section aria-labelledby="trends-title" className="mt-8 pt-4">
        <h2 id="trends-title" className="text-xl font-semibold tracking-tight text-foreground mb-4">
          Trends
        </h2>
        <div className="dash-panel p-2 sm:p-6">
          <SymptomsChart />
        </div>
      </section>
    </div>
  )
}

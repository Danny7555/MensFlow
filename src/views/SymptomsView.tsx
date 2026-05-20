import { useMemo, useState, useEffect } from 'react'
import { 
  Pill, Pulse, Drop, DropHalf, DropSimple, 
  Smiley, SmileyWink, SmileyXEyes, SmileySad, Fire, 
  Brain, Waves, Moon, HandHeart, Sparkle,
} from '@phosphor-icons/react'
import { format } from 'date-fns'
import { cn } from '../lib/utils'
import { SYMPTOM_DEFS } from '../data/symptomsData'
import type { SymptomCategory } from '../data/symptomsData'
import { SymptomsChart } from '../components/SymptomsChart'
import { CycleLengthChart } from '../components/tracker/CycleLengthChart'
import { useStore } from '../store/useStore'
import { TrackerSkeleton } from '../components/skeletons/TrackerSkeleton'

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
  toggleSymptom,
  isSaving
}: { 
  category: SymptomCategory, 
  IconComponent: React.ElementType, 
  activeSymptoms: Set<string>, 
  toggleSymptom: (id: string) => void,
  isSaving: boolean
}) {
  const items = SYMPTOM_DEFS.filter((s) => s.category === category)
  if (items.length === 0) return null

  return (
    <div className="dash-panel flex flex-col overflow-hidden">
      {category === 'Physical' && (
        <img src="/images/ovary.jpg" alt="" className="w-full h-32 object-cover object-[center_30%]" />
      )}
      {category === 'Mood' && (
        <img src="/images/happy.jpg" alt="" className="w-full h-32 object-cover object-[center_30%]" />
      )}
      {category === 'Flow' && (
        <img src="/images/flow.jpg" alt="" className="w-full h-32 object-cover object-[center_30%]" />
      )}
      <div className="p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium tracking-tight text-foreground flex items-center gap-2">
            <IconComponent size={20} className="text-[var(--mf-accent)]" />
            {category}
          </h3>
          <span className="text-[0.65rem] uppercase tracking-widest text-muted-foreground font-medium">
            {items.length} options
          </span>
        </div>
      <div className={cn("flex flex-wrap gap-2.5", isSaving && "opacity-60 pointer-events-none")}>
        {items.map((symptom) => {
          const isActive = activeSymptoms.has(symptom.id)
          return (
            <button
              key={symptom.id}
              type="button"
              onClick={() => toggleSymptom(symptom.id)}
              disabled={isSaving}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-300 cursor-pointer",
                isActive
                  ? "bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] border-[var(--mf-accent-border)] scale-[1.02]"
                  : "bg-card text-muted-foreground border-border hover:border-[var(--mf-accent-border)] hover:text-foreground",
                isSaving && "cursor-not-allowed opacity-75"
              )}
            >
              {(() => {
                const imgMap: Record<string, string> = {
                  'mood-happy': '/images/happy.jpg',
                  'mood-sad': '/images/sad.jpg',
                  'mood-irritable': '/images/angry.jpg',
                  'mood-anxious': '/images/anxious.jpg',
                  'mood-calm': '/images/calm.jpg',
                  'phys-cramps': '/images/cramps.jpg',
                  'phys-fatigue': '/images/fatique.jpg',
                  'phys-bloating': '/images/bloat.jpg',
                  'phys-headache': '/images/headache.jpg',
                  'phys-acne': '/images/acne.jpg',
                  'phys-tender': '/images/tender.jpg',
                }
                if (imgMap[symptom.id]) {
                  return <img src={imgMap[symptom.id]} alt="" className="size-6 rounded-full object-cover" />
                }
                if (SYMPTOM_ICONS[symptom.id]) {
                  const Icon = SYMPTOM_ICONS[symptom.id]
                  return (
                    <span className={cn(isActive ? "text-[var(--mf-accent)]" : "text-muted-foreground/60")}>
                      <Icon size={16} />
                    </span>
                  )
                }
                return null
              })()}
              {symptom.label}
            </button>
          )
        })}
        </div>
      </div>
    </div>
  )
}

export function SymptomsView() {
  const { addLog, getLogForDate, isSaving } = useStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const todayKey = useMemo(() => format(new Date(), 'yyyy-MM-dd'), [])

  const currentLog = getLogForDate(todayKey)

  const activeSymptoms = useMemo(() => new Set(currentLog?.symptoms || []), [currentLog])

  const todayStr = useMemo(() => {
    return new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
  }, [])

  if (isLoading) {
    return <TrackerSkeleton />
  }

  const toggleSymptom = async (id: string) => {
    if (isSaving) return
    const next = new Set(activeSymptoms)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    await addLog(todayKey, Array.from(next))
  }

  return (
    <div className="flex-1 w-full max-w-[1200px] mx-auto p-6 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="dash-header">
        <div className="dash-header-left">
          <img src="/images/girl.png" alt="" className="dash-avatar" />
          <div>
            <p className="dash-kicker">Tracking</p>
            <div className="flex items-center gap-3">
              <h1 className="dash-title">Daily symptoms</h1>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted/40 border border-border/50 sync-pill mt-1">
                <div className={cn("size-1.5 rounded-full", isSaving ? "bg-orange-400 sync-dot-active" : "bg-green-500")} />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {isSaving ? 'Syncing' : 'Synced'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="dash-header-meta">
          <span className="dash-pill">
            <img src="/images/cal.png" alt="" width={16} height={16} className="object-contain mr-1.5" aria-hidden />
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
          <SymptomCategoryList category="Physical" IconComponent={Pulse} activeSymptoms={activeSymptoms} toggleSymptom={toggleSymptom} isSaving={isSaving} />
          <SymptomCategoryList category="Mood" IconComponent={Pill} activeSymptoms={activeSymptoms} toggleSymptom={toggleSymptom} isSaving={isSaving} />
          <SymptomCategoryList category="Flow" IconComponent={Drop} activeSymptoms={activeSymptoms} toggleSymptom={toggleSymptom} isSaving={isSaving} />
        </div>
      </section>

      <section aria-labelledby="trends-title" className="space-y-6 pt-4">
        <h2 id="trends-title" className="text-lg font-medium tracking-tight text-foreground">
          Analytical Cycle Graphs & Trends
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="dash-panel p-0 overflow-hidden">
            <SymptomsChart />
          </div>
          <div className="dash-panel p-0 overflow-hidden">
            <CycleLengthChart />
          </div>
        </div>
      </section>
    </div>
  )
}

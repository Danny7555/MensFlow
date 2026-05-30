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
  isSaving,
  readOnly = false
}: { 
  category: SymptomCategory, 
  IconComponent: React.ElementType, 
  activeSymptoms: Set<string>, 
  toggleSymptom: (id: string) => void,
  isSaving: boolean,
  readOnly?: boolean
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
          <h3 className="text-sm font-normal tracking-tight text-foreground flex items-center gap-2">
            <IconComponent size={20} className="text-[var(--mf-accent)]" />
            {category}
          </h3>
          <span className="text-[0.65rem] uppercase tracking-widest text-muted-foreground font-normal">
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
              onClick={() => !readOnly && toggleSymptom(symptom.id)}
              disabled={isSaving || readOnly}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-normal border transition-all duration-300",
                !readOnly && "cursor-pointer",
                isActive
                  ? (symptom.id === 'flow-medium' ? "bg-rose-100 text-rose-600 border-rose-300 scale-[1.02] dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/40" : 
                     symptom.id === 'flow-heavy' ? "bg-red-100 text-red-700 border-red-400 scale-[1.02] dark:bg-red-500/30 dark:text-red-400 dark:border-red-500/50" : 
                     "bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] border-[var(--mf-accent-border)] scale-[1.02]")
                  : "bg-card text-muted-foreground border-border hover:border-[var(--mf-accent-border)] hover:text-foreground"
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
                    <span className={cn(isActive ? (
                      symptom.id === 'flow-medium' ? "text-rose-600 dark:text-rose-400" :
                      symptom.id === 'flow-heavy' ? "text-red-700 dark:text-red-400" :
                      "text-[var(--mf-accent)]"
                    ) : "text-muted-foreground/60")}>
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
  const { addLog, getLogForDate, isSaving, user, partnerStatus } = useStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const todayKey = useMemo(() => format(new Date(), 'yyyy-MM-dd'), [])

  const currentLog = getLogForDate(todayKey)
  const isPartner = user?.role === 'partner'

  const activeSymptoms = useMemo(() => {
    if (isPartner) {
      return new Set(partnerStatus?.cycle?.symptoms || [])
    }
    return new Set(currentLog?.symptoms || [])
  }, [currentLog, isPartner, partnerStatus])

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
            <p className="dash-kicker">{isPartner ? "Partner's Cycle" : "Tracking"}</p>
            <div className="flex items-center gap-3">
              <h1 className="dash-title">{isPartner ? "Her Daily Symptoms" : "Daily symptoms"}</h1>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted/40 border border-border/50 sync-pill mt-1">
                <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-wider">
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
          {isPartner 
            ? `Shared symptoms logged by ${partnerStatus?.partner?.name || 'your partner'}` 
            : "Log how you feel to discover patterns"}
        </p>
      </header>

      <section aria-labelledby="today-log-title" className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 id="today-log-title" className="text-lg font-normal tracking-tight text-foreground">
            Current Status
          </h2>
          <p className="text-xs text-muted-foreground">
            {activeSymptoms.size} symptoms logged
          </p>
        </div>

        {isPartner ? (
          <div className="dash-panel p-8 rounded-[2rem] bg-[var(--mf-card)] border border-[var(--mf-border)]">
            {activeSymptoms.size === 0 ? (
              <div className="text-center py-8 space-y-4">
                <div className="size-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                  <Pulse size={32} />
                </div>
                <h3 className="text-base font-normal text-[var(--mf-text-strong)]">No Symptoms Logged</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {partnerStatus?.partner?.name || 'Your partner'} has not logged any symptoms for today yet.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                <p className="text-xs text-muted-foreground">
                  Here is what {partnerStatus?.partner?.name || 'your partner'} logged today:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {['Flow', 'Mood', 'Physical'].map((cat) => {
                    const catSymptoms = SYMPTOM_DEFS.filter(
                      (s) => s.category === cat && activeSymptoms.has(s.id)
                    )
                    if (catSymptoms.length === 0) return null

                    const IconComponent = cat === 'Physical' ? Pulse : cat === 'Mood' ? Pill : Drop
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

                    return (
                      <div key={cat} className="space-y-4 p-5 rounded-2xl bg-muted/20 border border-border/50">
                        <h4 className="text-xs font-normal tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
                          <IconComponent size={16} className="text-[var(--mf-accent)]" />
                          {cat}
                        </h4>
                        <div className="flex flex-col gap-2">
                          {catSymptoms.map((symptom) => (
                            <div 
                              key={symptom.id} 
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-card border border-border text-sm font-normal text-[var(--mf-text-strong)]"
                            >
                              {imgMap[symptom.id] ? (
                                <img src={imgMap[symptom.id]} alt="" className="size-6 rounded-full object-cover" />
                              ) : SYMPTOM_ICONS[symptom.id] ? (
                                (() => {
                                  const Icon = SYMPTOM_ICONS[symptom.id]
                                  return (
                                    <span className="text-[var(--mf-accent)]">
                                      <Icon size={16} />
                                    </span>
                                  )
                                })()
                              ) : null}
                              <span>{symptom.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SymptomCategoryList category="Physical" IconComponent={Pulse} activeSymptoms={activeSymptoms} toggleSymptom={toggleSymptom} isSaving={isSaving} readOnly={isPartner} />
            <SymptomCategoryList category="Mood" IconComponent={Pill} activeSymptoms={activeSymptoms} toggleSymptom={toggleSymptom} isSaving={isSaving} readOnly={isPartner} />
            <SymptomCategoryList category="Flow" IconComponent={Drop} activeSymptoms={activeSymptoms} toggleSymptom={toggleSymptom} isSaving={isSaving} readOnly={isPartner} />
          </div>
        )}
      </section>

      {!isPartner ? (
        <section aria-labelledby="trends-title" className="space-y-6 pt-4">
          <h2 id="trends-title" className="text-lg font-normal tracking-tight text-foreground">
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
      ) : (
        <section className="pt-4">
          <div className="p-6 rounded-[2rem] bg-[var(--mf-card)] border border-[var(--mf-border)] text-center space-y-4">
            <h2 className="text-sm font-normal tracking-tight text-foreground">Analytical Trends Private</h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              Historical cycle graphs, trends, and diagnostic symptom charts are managed privately on your partner's device.
            </p>
          </div>
        </section>
      )}
    </div>
  )
}

import { useMemo, useState, useEffect } from 'react'
import { 
  Pill, Pulse, Drop, DropHalf, DropSimple, 
  Smiley, SmileyWink, SmileyXEyes, SmileySad, Fire, 
  Brain, Waves, Moon, HandHeart, Sparkle, Flask, PencilSimple,
} from '@phosphor-icons/react'
import { format } from 'date-fns'
import { cn } from '../lib/utils'
import { SYMPTOM_DEFS } from '../data/symptomsData'
import type { SymptomCategory, SymptomDef } from '../data/symptomsData'
import { SymptomsChart } from '../components/SymptomsChart'
import { CycleLengthChart } from '../components/tracker/CycleLengthChart'
import { useStore } from '../store/useStore'
import { TrackerSkeleton } from '../components/skeletons/TrackerSkeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  'pcos-hirsutism': Sparkle,
  'pcos-oily': Waves,
  'pcos-hairloss': Moon,
  'endo-pelvicpain': Pulse,
  'endo-painsex': HandHeart,
  'endo-backache': Brain,
  'peri-hotflash': Fire,
  'peri-nightsweat': Waves,
  'peri-brainfog': Brain,
}

function SymptomCategoryList({ 
  category, 
  IconComponent, 
  activeSymptoms, 
  toggleSymptom,
  isSaving,
  readOnly = false,
  availableSymptoms
}: { 
  category: SymptomCategory, 
  IconComponent: React.ElementType, 
  activeSymptoms: Set<string>, 
  toggleSymptom: (id: string) => void,
  isSaving: boolean,
  readOnly?: boolean,
  availableSymptoms: SymptomDef[]
}) {
  const items = availableSymptoms.filter((s) => s.category === category)
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
  const { addLog, getLogForDate, isSaving, user, partnerStatus, fetchPartnerStatus, requestDetailedAccessAction, customSymptoms, settings } = useStore()
  const [isLoading, setIsLoading] = useState(true)
  const [requestSent, setRequestSent] = useState(false)

  const handleRequestAccess = async () => {
    setRequestSent(true)
    await requestDetailedAccessAction()
    await fetchPartnerStatus()
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const todayKey = useMemo(() => format(new Date(), 'yyyy-MM-dd'), [])

  const currentLog = getLogForDate(todayKey)

  const availableSymptoms = useMemo(() => {
    return [...SYMPTOM_DEFS, ...customSymptoms].filter(s => {
      if (s.id.startsWith('pcos-') && settings.conditionOptimization !== 'pcos') return false;
      if (s.id.startsWith('endo-') && settings.conditionOptimization !== 'endometriosis') return false;
      if (s.id.startsWith('peri-') && settings.conditionOptimization !== 'perimenopause') return false;
      return true;
    });
  }, [customSymptoms, settings.conditionOptimization]);
  const isPartner = user?.role === 'partner'
  const showRestrictedView = isPartner && partnerStatus?.paired && partnerStatus?.privacyShareCycleDetails === false

  useEffect(() => {
    if (isPartner && partnerStatus === null) {
      void fetchPartnerStatus()
    }
  }, [isPartner, partnerStatus, fetchPartnerStatus])

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
    await addLog(todayKey, Array.from(next), currentLog?.lhLevel ?? null, currentLog?.mucus ?? null)
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

      {/* Symptothermal NFP Indicators Panel */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-normal tracking-tight text-foreground">
            Symptothermal NFP Indicators
          </h2>
          <span className="text-[9px] font-normal uppercase tracking-[0.2em] bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] px-3 py-1 rounded-full border border-[var(--mf-accent)]/20">
            Evidence-Based NFP
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LH Ovulation Test Card */}
          <div className="dash-panel p-6 flex flex-col justify-between">
            <div className="flex items-start justify-between w-full">
              <div className="space-y-1 flex-1">
                <span className="text-[10px] font-normal uppercase tracking-[0.1em] text-muted-foreground block">LH Ovulation Test</span>
                {isPartner ? (
                  <h4 className="text-2xl font-normal text-[var(--mf-text-strong)] capitalize mt-1">
                    {partnerStatus?.cycle?.lhLevel ? partnerStatus.cycle.lhLevel : 'Not logged'}
                  </h4>
                ) : (
                  <div className="mt-1">
                    <Select
                      value={currentLog?.lhLevel ?? "not-logged"}
                      onValueChange={async (value) => {
                        const val = value === "not-logged" ? null : value;
                        await addLog(todayKey, currentLog?.symptoms ?? [], val, currentLog?.mucus ?? null);
                      }}
                    >
                      <SelectTrigger 
                        title={currentLog?.lhLevel && currentLog.lhLevel !== 'not-logged' ? "Click to edit LH result" : "Click to select LH result"}
                        className={cn(
                          "border-none p-0 bg-transparent hover:bg-transparent h-auto focus-visible:ring-0 focus:ring-0 flex items-center gap-1 cursor-pointer text-left shadow-none outline-none focus-visible:ring-offset-0 focus:ring-offset-0 select-none data-[placeholder]:text-muted-foreground group/trigger",
                          (currentLog?.lhLevel && currentLog.lhLevel !== 'not-logged') 
                            ? "text-2xl font-normal text-[var(--mf-text-strong)] hover:text-[var(--mf-accent)] transition-colors capitalize [&_svg]:hidden border-b border-dashed border-muted-foreground/30 hover:border-[var(--mf-accent)]/50 pb-0.5" 
                            : "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-normal border border-border/50 hover:bg-muted/20 text-muted-foreground transition-colors [&_svg]:hidden"
                        )}
                      >
                        <SelectValue placeholder="➕ Not logged" />
                        {(currentLog?.lhLevel && currentLog.lhLevel !== 'not-logged') && (
                          <PencilSimple size={14} className="opacity-60 group-hover/trigger:opacity-100 transition-opacity text-muted-foreground group-hover/trigger:text-[var(--mf-accent)] shrink-0 ml-1.5" />
                        )}
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border border-border bg-card">
                        <SelectItem value="not-logged" className="text-muted-foreground">➕ Not logged</SelectItem>
                        <SelectItem value="negative">Negative</SelectItem>
                        <SelectItem value="positive">Positive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="size-10 rounded-2xl bg-pink-500/10 flex items-center justify-center shrink-0">
                <Flask size={22} className="text-pink-500" />
              </div>
            </div>
          </div>

          {/* Cervical Mucus Card */}
          <div className="dash-panel p-6 flex flex-col justify-between">
            <div className="flex items-start justify-between w-full">
              <div className="space-y-1 flex-1">
                <span className="text-[10px] font-normal uppercase tracking-[0.1em] text-muted-foreground block">Cervical Mucus Consistency</span>
                {isPartner ? (
                  <h4 className="text-2xl font-normal text-[var(--mf-text-strong)] capitalize mt-1">
                    {partnerStatus?.cycle?.mucus ? partnerStatus.cycle.mucus.replace('-', ' ') : 'Not logged'}
                  </h4>
                ) : (
                  <div className="mt-1">
                    <Select
                      value={currentLog?.mucus ?? "not-logged"}
                      onValueChange={async (value) => {
                        const val = value === "not-logged" ? null : value;
                        await addLog(todayKey, currentLog?.symptoms ?? [], currentLog?.lhLevel ?? null, val);
                      }}
                    >
                      <SelectTrigger 
                        title={currentLog?.mucus && currentLog.mucus !== 'not-logged' ? "Click to edit cervical mucus" : "Click to select consistency"}
                        className={cn(
                          "border-none p-0 bg-transparent hover:bg-transparent h-auto focus-visible:ring-0 focus:ring-0 flex items-center gap-1 cursor-pointer text-left shadow-none outline-none focus-visible:ring-offset-0 focus:ring-offset-0 select-none data-[placeholder]:text-muted-foreground group/trigger",
                          (currentLog?.mucus && currentLog.mucus !== 'not-logged') 
                            ? "text-2xl font-normal text-[var(--mf-text-strong)] hover:text-[var(--mf-accent)] transition-colors capitalize [&_svg]:hidden border-b border-dashed border-muted-foreground/30 hover:border-[var(--mf-accent)]/50 pb-0.5" 
                            : "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-normal border border-border/50 hover:bg-muted/20 text-muted-foreground transition-colors [&_svg]:hidden"
                        )}
                      >
                        <SelectValue placeholder="➕ Not logged" />
                        {(currentLog?.mucus && currentLog.mucus !== 'not-logged') && (
                          <PencilSimple size={14} className="opacity-60 group-hover/trigger:opacity-100 transition-opacity text-muted-foreground group-hover/trigger:text-[var(--mf-accent)] shrink-0 ml-1.5" />
                        )}
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border border-border bg-card">
                        <SelectItem value="not-logged" className="text-muted-foreground">➕ Not logged</SelectItem>
                        <SelectItem value="dry">Dry</SelectItem>
                        <SelectItem value="sticky">Sticky</SelectItem>
                        <SelectItem value="creamy">Creamy</SelectItem>
                        <SelectItem value="egg-white">Egg White (Fertile)</SelectItem>
                        <SelectItem value="watery">Watery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="size-10 flex items-center justify-center shrink-0">
                <img src="/images/water.png" alt="" className="size-8 object-contain" />
              </div>
            </div>
          </div>
        </div>
      </section>

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
                    const catSymptoms = [...SYMPTOM_DEFS, ...customSymptoms].filter(
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
            <SymptomCategoryList category="Physical" IconComponent={Pulse} activeSymptoms={activeSymptoms} toggleSymptom={toggleSymptom} isSaving={isSaving} readOnly={isPartner} availableSymptoms={availableSymptoms} />
            <SymptomCategoryList category="Mood" IconComponent={Pill} activeSymptoms={activeSymptoms} toggleSymptom={toggleSymptom} isSaving={isSaving} readOnly={isPartner} availableSymptoms={availableSymptoms} />
            <SymptomCategoryList category="Flow" IconComponent={Drop} activeSymptoms={activeSymptoms} toggleSymptom={toggleSymptom} isSaving={isSaving} readOnly={isPartner} availableSymptoms={availableSymptoms} />
          </div>
        )}
      </section>

      {!showRestrictedView ? (
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
          <div className="p-6 sm:p-8 rounded-[2rem] bg-[var(--mf-card)] border border-[var(--mf-border)] text-center w-full max-w-md mx-auto space-y-4 flex flex-col items-center">
            <h2 className="text-sm font-normal tracking-tight text-foreground">Analytical Trends Private</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Historical cycle graphs, trends, and diagnostic symptom charts are managed privately on your partner's device.
            </p>
            <button
              type="button"
              onClick={handleRequestAccess}
              disabled={requestSent}
              className={cn(
                "px-6 py-2.5 rounded-full text-xs font-normal transition-all",
                requestSent 
                  ? "bg-emerald-500 text-white cursor-default animate-in fade-in" 
                  : "bg-[var(--mf-accent)] text-white hover:brightness-110 active-squish cursor-pointer border-0 outline-none"
              )}
            >
              {requestSent ? "Access Request Sent ✔" : "Request Detailed Access"}
            </button>
          </div>
        </section>
      )}
    </div>
  )
}

/* eslint-disable */
import { useState, useRef, useMemo } from "react"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { SYMPTOM_DEFS, type SymptomCategory } from "@/data/symptomsData"
import { Drop, Smiley, Pulse, Bed, Check, Sparkle, Waves, Moon, HandHeart, Brain, Fire, CaretDown, Plus } from "@phosphor-icons/react"
import { useStore } from "@/store/useStore"
import { toast } from "sonner"

const categories = [
  { name: "Flow", icon: Drop, color: "text-[#ff5a5f]", bgColor: "bg-[#ff5a5f]/10" },
  { name: "Mood", icon: Smiley, color: "text-[#007e94]", bgColor: "bg-[#007e94]/10" },
  { name: "Physical", icon: Pulse, color: "text-[#6fd0cd]", bgColor: "bg-[#6fd0cd]/10" },
  { name: "Lifestyle", icon: Bed, color: "text-[#8b5cf6]", bgColor: "bg-[#8b5cf6]/10" },
] as const

const symptomImages: Record<string, string> = {
  'flow-light': '/images/flow_light.png',
  'flow-medium': '/images/flow_medium.png',
  'flow-heavy': '/images/flow_heavy.png',
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
  'life-sleep': '/images/sleep_3d.png',
  'life-bbt': '/images/bbt_3d.png',
  'life-sex': '/images/sex_3d.png',
  'life-pill': '/images/pill_3d.png',
}

interface LogSymptomsModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  activeDay: number
  activeDate: Date
}

const SYMPTOM_ICONS: Record<string, React.ElementType> = {
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

export function LogSymptomsModal({ isOpen, onOpenChange, activeDay, activeDate }: LogSymptomsModalProps) {
  const { addLog, getLogForDate, isSaving, customSymptoms, addCustomSymptom, user, settings } = useStore()
  const isPartner = user?.role === 'partner'
  const dateKey = format(activeDate, 'yyyy-MM-dd')
  const [selectedSymptoms, setSelectedSymptoms] = useState<Set<string>>(new Set())
  const [lhLevelVal, setLhLevelVal] = useState<string | null>(null)
  const [mucusVal, setMucusVal] = useState<string | null>(null)
  const loadedDateKeyRef = useRef<string | null>(null)

  if (isOpen && loadedDateKeyRef.current !== dateKey) {
    const existing = getLogForDate(dateKey)
    loadedDateKeyRef.current = dateKey
    setSelectedSymptoms(existing ? new Set(existing.symptoms) : new Set())
    setLhLevelVal(existing?.lhLevel !== undefined ? existing.lhLevel : null)
    setMucusVal(existing?.mucus !== undefined ? existing.mucus : null)
  } else if (!isOpen && loadedDateKeyRef.current !== null) {
    loadedDateKeyRef.current = null
  }

  const [newSymptomName, setNewSymptomName] = useState("")
  const [newSymptomCat, setNewSymptomCat] = useState<SymptomCategory>("Physical")

  const toggleSymptom = (id: string) => {
    if (isSaving) return
    const next = new Set(selectedSymptoms)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedSymptoms(next)
  }

  const handleAddSymptom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSymptomName.trim()) return
    addCustomSymptom(newSymptomName.trim(), newSymptomCat)
    toast.success(`Added custom tracker: "${newSymptomName.trim()}"`)
    setNewSymptomName("")
  }

  const handleSave = async () => {
    const success = await addLog(dateKey, Array.from(selectedSymptoms), lhLevelVal, mucusVal)
    if (!success) return

    // Check if user logged a 'flow' symptom to trigger the toast
    const loggedFlow = Array.from(selectedSymptoms).some(s => s.startsWith('flow-'))

    if (loggedFlow) {
      toast.success("Period logged", {
        description: `Your period was recorded for Day ${activeDay}.`,
        duration: 4000,
      })
    } else {
      toast.success("Log saved", {
        description: `Symptoms saved for Day ${activeDay}.`,
        duration: 3000,
      })
    }

    onOpenChange(false)
  }



  const allSymptoms = useMemo(() => {
    return [...SYMPTOM_DEFS, ...customSymptoms].filter(s => {
      // If symptom is pcos-specific, only show if optimization is pcos
      if (s.id.startsWith('pcos-') && settings.conditionOptimization !== 'pcos') return false;
      // If symptom is endo-specific, only show if optimization is endometriosis
      if (s.id.startsWith('endo-') && settings.conditionOptimization !== 'endometriosis') return false;
      // If symptom is peri-specific, only show if optimization is perimenopause
      if (s.id.startsWith('peri-') && settings.conditionOptimization !== 'perimenopause') return false;
      return true;
    });
  }, [customSymptoms, settings.conditionOptimization]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none rounded-[32px] bg-background">
        <div className="p-0 sm:p-8">
          <DialogHeader className="mb-4 sm:mb-6">
            <DialogTitle className="text-2xl font-normal tracking-tight">
              {isPartner ? `Partner Symptoms: Day ${activeDay}` : `Log Symptoms: Day ${activeDay}`}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground pt-1">
              {isPartner ? "View logged symptoms and moods for this day." : "Select any symptoms or moods you're experiencing today."}
            </DialogDescription>
          </DialogHeader>

          <div className={cn("space-y-4 sm:space-y-6 max-h-[440px] overflow-y-auto pr-2 scrollbar-hide transition-opacity", isSaving && "opacity-50 pointer-events-none")}>
            {categories.map((cat) => {
              const items = allSymptoms.filter(s => s.category === cat.name)
              if (items.length === 0) return null

              return (
                <div key={cat.name} className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <cat.icon className={cn("size-4", cat.color)} weight="regular" />
                    <span className="text-xs font-normal uppercase tracking-widest text-muted-foreground">{cat.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {items.map((s) => {
                      const isActive = selectedSymptoms.has(s.id)
                      const imgSrc = symptomImages[s.id]

                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleSymptom(s.id)}
                          disabled={isSaving || isPartner}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border",
                            isActive 
                              ? (s.id === 'flow-medium' ? "bg-rose-100 text-rose-600 border-rose-300 shadow-sm shadow-rose-500/10 scale-[1.02] dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/40" : 
                                 s.id === 'flow-heavy' ? "bg-red-100 text-red-700 border-red-400 shadow-sm shadow-red-500/10 scale-[1.02] dark:bg-red-500/30 dark:text-red-400 dark:border-red-500/50" : 
                                 "bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] border-[var(--mf-accent-border)] shadow-sm shadow-[var(--mf-accent)]/5 scale-[1.02]") 
                              : "bg-card text-muted-foreground border-border hover:border-[var(--mf-accent-border)] hover:text-foreground hover:bg-[var(--mf-hover)]",
                            isPartner && "cursor-default hover:border-border"
                          )}
                        >
                          {imgSrc ? (
                            <img src={imgSrc} alt="" className="size-6 rounded-full object-cover" />
                          ) : (
                            <div className={cn("size-6 rounded-full flex items-center justify-center bg-muted/50")}>
                               {(() => {
                                 const CustomIcon = SYMPTOM_ICONS[s.id]
                                 const Icon = CustomIcon || cat.icon
                                 return (
                                   <Icon size={14} className={isActive ? (
                                      s.id === 'flow-medium' ? "text-rose-600 dark:text-rose-400" :
                                      s.id === 'flow-heavy' ? "text-red-700 dark:text-red-400" :
                                      "text-[var(--mf-accent)]"
                                   ) : "text-muted-foreground/40"} />
                                 )
                               })()}
                            </div>
                          )}
                          <span className="truncate">{s.label}</span>
                          {isActive && <Check size={14} weight="bold" className="shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* Specialized NFP / Fertility Indicators */}
            <div className="pt-4 border-t border-border mt-4 space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Sparkle className="size-4 text-[#e07a5f]" />
                <span className="text-xs font-normal uppercase tracking-widest text-muted-foreground">Fertility & NFP Indicators</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* LH Level */}
                <div className="space-y-1.5">
                  <label htmlFor="lh-select" className="text-xs text-muted-foreground block">LH Ovulation Test</label>
                  {isPartner ? (
                    <div id="lh-select" className="h-10 px-3 rounded-xl bg-muted/30 border border-transparent text-sm flex items-center text-[var(--mf-text-strong)] capitalize">
                      {lhLevelVal !== null ? lhLevelVal : <span className="text-muted-foreground/60 italic">Not logged</span>}
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        id="lh-select"
                        value={lhLevelVal ?? ''}
                        onChange={(e) => setLhLevelVal(e.target.value || null)}
                        className="w-full h-10 pl-3 pr-10 rounded-xl bg-muted/50 border border-border text-sm text-[var(--mf-text-strong)] appearance-none outline-none focus:border-[var(--mf-accent-border)] focus:bg-[var(--mf-accent-soft)]/20 transition-all capitalize cursor-pointer"
                      >
                        <option value="" disabled>Select Result</option>
                        <option value="negative">Negative</option>
                        <option value="positive">Positive</option>
                      </select>
                      <CaretDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" weight="bold" />
                    </div>
                  )}
                </div>
                {/* Cervical Mucus */}
                <div className="space-y-1.5">
                  <label htmlFor="mucus-select" className="text-xs text-muted-foreground block">Cervical Mucus</label>
                  {isPartner ? (
                    <div id="mucus-select" className="h-10 px-3 rounded-xl bg-muted/30 border border-transparent text-sm flex items-center text-[var(--mf-text-strong)] capitalize">
                      {mucusVal !== null ? mucusVal.replace('-', ' ') : <span className="text-muted-foreground/60 italic">Not logged</span>}
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        id="mucus-select"
                        value={mucusVal ?? ''}
                        onChange={(e) => setMucusVal(e.target.value || null)}
                        className="w-full h-10 pl-3 pr-10 rounded-xl bg-muted/50 border border-border text-sm text-[var(--mf-text-strong)] appearance-none outline-none focus:border-[var(--mf-accent-border)] focus:bg-[var(--mf-accent-soft)]/20 transition-all capitalize cursor-pointer"
                      >
                        <option value="" disabled>Select Consistency</option>
                        <option value="dry">Dry</option>
                        <option value="sticky">Sticky</option>
                        <option value="creamy">Creamy</option>
                        <option value="egg-white">Egg White (Fertile)</option>
                        <option value="watery">Watery</option>
                      </select>
                      <CaretDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" weight="bold" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Add Custom Symptom Form */}
            {!isPartner && (
              <form onSubmit={handleAddSymptom} className="pt-4 border-t border-border mt-2 space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Sparkle className="size-4 text-muted-foreground" weight="regular" />
                  <span className="text-xs font-normal uppercase tracking-widest text-muted-foreground">Create Custom Tracker</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="e.g. Backache, Caffeine log..."
                      value={newSymptomName}
                      onChange={(e) => setNewSymptomName(e.target.value)}
                      aria-label="Custom symptom name"
                      className="w-full h-10 pl-4 pr-4 rounded-xl bg-muted/50 border border-border outline-none focus:border-[var(--mf-accent-border)] text-sm transition-all"
                    />
                  </div>
                  <div className="relative min-w-[130px]">
                    <select
                      value={newSymptomCat}
                      onChange={(e) => setNewSymptomCat(e.target.value as SymptomCategory)}
                      className="w-full h-10 pl-3 pr-8 rounded-xl bg-muted/50 border border-border text-sm text-muted-foreground appearance-none outline-none focus:border-[var(--mf-accent-border)] transition-all cursor-pointer"
                    >
                      <option value="Physical">Physical</option>
                      <option value="Mood">Mood</option>
                      <option value="Lifestyle">Lifestyle</option>
                    </select>
                    <CaretDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" weight="bold" />
                  </div>
                  <button
                    type="submit"
                    className="h-10 px-5 rounded-xl bg-[var(--mf-accent)] text-white text-sm font-normal hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <Plus size={14} weight="bold" />
                    Add
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="mt-6 sm:mt-8 flex gap-3">
            {isPartner ? (
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex-1 h-12 rounded-2xl bg-secondary text-foreground font-normal hover:bg-secondary/80 transition-all flex items-center justify-center"
              >
                Close
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className={cn(
                  "flex-1 h-12 rounded-2xl bg-[var(--mf-accent)] text-white font-normal hover:brightness-110 transition-all flex items-center justify-center gap-2",
                  isSaving && "opacity-80 cursor-not-allowed"
                )}
              >
                {isSaving ? (
                  <>
                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Syncing…</span>
                  </>
                ) : (
                  <>
                    <Check size={16} weight="bold" />
                    Save Log
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

import { useState } from "react"
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
import { Drop, Smiley, Pulse, Bed, Check } from "@phosphor-icons/react"
import { useStore } from "@/store/useStore"
import { toast } from "sonner"

interface LogSymptomsModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  activeDay: number
  activeDate: Date
}

export function LogSymptomsModal({ isOpen, onOpenChange, activeDay, activeDate }: LogSymptomsModalProps) {
  const { addLog, getLogForDate, isSaving, customSymptoms, addCustomSymptom, user } = useStore()
  const isPartner = user?.role === 'partner'
  const dateKey = format(activeDate, 'yyyy-MM-dd')
  const [selectedSymptoms, setSelectedSymptoms] = useState<Set<string>>(() => {
    if (!isOpen) return new Set()
    const existing = getLogForDate(dateKey)
    return existing ? new Set(existing.symptoms) : new Set()
  })

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
    await addLog(dateKey, Array.from(selectedSymptoms))

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

  const allSymptoms = [...SYMPTOM_DEFS, ...customSymptoms]

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none rounded-[32px] bg-background">
        <div className="p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-normal tracking-tight">
              {isPartner ? `Partner Symptoms: Day ${activeDay}` : `Log Symptoms: Day ${activeDay}`}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground pt-1">
              {isPartner ? "View logged symptoms and moods for this day." : "Select any symptoms or moods you're experiencing today."}
            </DialogDescription>
          </DialogHeader>

          <div className={cn("space-y-6 max-h-[440px] overflow-y-auto pr-2 scrollbar-hide transition-opacity", isSaving && "opacity-50 pointer-events-none")}>
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
                            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border",
                            isActive 
                              ? (s.id === 'flow-medium' ? "bg-rose-100 text-rose-600 border-rose-300 scale-[1.02] dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/40" : 
                                 s.id === 'flow-heavy' ? "bg-red-100 text-red-700 border-red-400 scale-[1.02] dark:bg-red-500/30 dark:text-red-400 dark:border-red-500/50" : 
                                 "bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] border-[var(--mf-accent-border)] scale-[1.02]") 
                              : "bg-card text-muted-foreground border-border hover:border-[var(--mf-accent-border)] hover:text-foreground",
                            isPartner && "cursor-default hover:border-border"
                          )}
                        >
                          {imgSrc ? (
                            <img src={imgSrc} alt="" className="size-6 rounded-full object-cover" />
                          ) : (
                            <div className={cn("size-6 rounded-full flex items-center justify-center bg-muted/50")}>
                               <cat.icon size={14} className={isActive ? (
                                  s.id === 'flow-medium' ? "text-rose-600 dark:text-rose-400" :
                                  s.id === 'flow-heavy' ? "text-red-700 dark:text-red-400" :
                                  "text-[var(--mf-accent)]"
                               ) : "text-muted-foreground/40"} />
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

            {/* Add Custom Symptom Form */}
            {!isPartner && (
              <form onSubmit={handleAddSymptom} className="pt-4 border-t border-border mt-2 space-y-3">
                <span className="text-xs font-normal uppercase tracking-widest text-muted-foreground block">Create Custom Tracker</span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Backache, Caffeine log..."
                    value={newSymptomName}
                    onChange={(e) => setNewSymptomName(e.target.value)}
                    className="flex-1 h-10 px-4 rounded-xl bg-muted/50 border-none outline-none focus:ring-1 ring-[var(--mf-accent)] text-sm transition-all"
                  />
                  <select
                    value={newSymptomCat}
                    onChange={(e) => setNewSymptomCat(e.target.value as SymptomCategory)}
                    className="h-10 px-3 rounded-xl bg-muted/50 border-none outline-none text-sm text-muted-foreground focus:ring-1 ring-[var(--mf-accent)]"
                  >
                    <option value="Physical">Physical</option>
                    <option value="Mood">Mood</option>
                    <option value="Lifestyle">Lifestyle</option>
                  </select>
                  <button
                    type="submit"
                    className="h-10 px-4 rounded-xl bg-[var(--mf-accent)] text-white text-sm font-normal hover:brightness-105 active:scale-95 transition-all"
                  >
                    Add
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="mt-8 flex gap-3">
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
                  "flex-1 h-12 rounded-2xl bg-[var(--mf-accent)] text-white font-normal hover:brightness-110 transition-all shadow-none flex items-center justify-center gap-2",
                  isSaving && "opacity-80 cursor-not-allowed"
                )}
              >
                {isSaving ? (
                  <>
                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Syncing…</span>
                  </>
                ) : (
                  "Save Log"
                )}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

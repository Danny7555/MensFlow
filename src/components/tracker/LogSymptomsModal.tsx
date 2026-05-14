import { useState } from "react"
<<<<<<< HEAD
import { format } from "date-fns"
=======
>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { SYMPTOM_DEFS } from "@/data/symptomsData"
import { Drop, Smiley, Pulse } from "@phosphor-icons/react"
<<<<<<< HEAD
import { useStore } from "@/store/useStore"
import { toast } from "sonner"
=======
>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)

interface LogSymptomsModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  activeDay: number
<<<<<<< HEAD
  activeDate: Date
}

export function LogSymptomsModal({ isOpen, onOpenChange, activeDay, activeDate }: LogSymptomsModalProps) {
  const { addLog, getLogForDate, isSaving } = useStore()
  const dateKey = format(activeDate, 'yyyy-MM-dd')
  const [selectedSymptoms, setSelectedSymptoms] = useState<Set<string>>(() => {
    if (!isOpen) return new Set()
    const existing = getLogForDate(dateKey)
    return existing ? new Set(existing.symptoms) : new Set()
  })

  const toggleSymptom = (id: string) => {
    if (isSaving) return
=======
}

export function LogSymptomsModal({ isOpen, onOpenChange, activeDay }: LogSymptomsModalProps) {
  const [selectedSymptoms, setSelectedSymptoms] = useState<Set<string>>(new Set())

  const toggleSymptom = (id: string) => {
>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)
    const next = new Set(selectedSymptoms)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedSymptoms(next)
  }

<<<<<<< HEAD
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

=======
>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)
  const categories = [
    { name: "Flow", icon: Drop, color: "text-[#ff5a5f]", bgColor: "bg-[#ff5a5f]/10" },
    { name: "Mood", icon: Smiley, color: "text-[#007e94]", bgColor: "bg-[#007e94]/10" },
    { name: "Physical", icon: Pulse, color: "text-[#6fd0cd]", bgColor: "bg-[#6fd0cd]/10" },
  ]

  const symptomImages: Record<string, string> = {
<<<<<<< HEAD
    'flow-light': '/images/flow_light.png',
    'flow-medium': '/images/flow_medium.png',
    'flow-heavy': '/images/flow_heavy.png',
=======
>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)
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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none rounded-[32px] bg-background">
        <div className="p-8">
          <DialogHeader className="mb-6">
<<<<<<< HEAD
            <DialogTitle className="text-2xl font-medium tracking-tight">Log Symptoms: Day {activeDay}</DialogTitle>
=======
            <DialogTitle className="text-2xl font-medium tracking-tight">Log Symptoms — Day {activeDay}</DialogTitle>
>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)
            <DialogDescription className="text-sm text-muted-foreground pt-1">
              Select any symptoms or moods you're experiencing today.
            </DialogDescription>
          </DialogHeader>

<<<<<<< HEAD
          <div className={cn("space-y-6 max-h-[440px] overflow-y-auto pr-2 scrollbar-hide transition-opacity", isSaving && "opacity-50 pointer-events-none")}>
=======
          <div className="space-y-6 max-h-[440px] overflow-y-auto pr-2 scrollbar-hide">
>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)
            {categories.map((cat) => {
              const items = SYMPTOM_DEFS.filter(s => s.category === cat.name)
              if (items.length === 0) return null

              return (
                <div key={cat.name} className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <cat.icon className={cn("size-4", cat.color)} weight="bold" />
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{cat.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {items.map((s) => {
                      const isActive = selectedSymptoms.has(s.id)
                      const imgSrc = symptomImages[s.id]
                      
                      return (
                        <button
                          key={s.id}
                          onClick={() => toggleSymptom(s.id)}
<<<<<<< HEAD
                          disabled={isSaving}
=======
>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border",
                            isActive 
                              ? "bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] border-[var(--mf-accent-border)] scale-[1.02]" 
                              : "bg-card text-muted-foreground border-border hover:border-[var(--mf-accent-border)] hover:text-foreground"
                          )}
                        >
                          {imgSrc ? (
                            <img src={imgSrc} alt="" className="size-6 rounded-full object-cover" />
                          ) : (
                            <div className={cn("size-6 rounded-full flex items-center justify-center bg-muted/50")}>
                               <cat.icon size={14} className={isActive ? "text-[var(--mf-accent)]" : "text-muted-foreground/40"} />
                            </div>
                          )}
                          {s.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-8 flex gap-3">
            <button 
<<<<<<< HEAD
              onClick={handleSave}
              disabled={isSaving}
              className={cn(
                "flex-1 h-12 rounded-2xl bg-[var(--mf-accent)] text-white font-medium hover:brightness-110 transition-all shadow-none flex items-center justify-center gap-2",
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
=======
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12 rounded-2xl bg-[var(--mf-accent)] text-white font-medium hover:brightness-110 transition-all shadow-none"
            >
              Save Log
>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

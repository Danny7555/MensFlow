import { useState } from "react"
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

interface LogSymptomsModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  activeDay: number
}

export function LogSymptomsModal({ isOpen, onOpenChange, activeDay }: LogSymptomsModalProps) {
  const [selectedSymptoms, setSelectedSymptoms] = useState<Set<string>>(new Set())

  const toggleSymptom = (id: string) => {
    const next = new Set(selectedSymptoms)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedSymptoms(next)
  }

  const categories = [
    { name: "Flow", icon: Drop, color: "text-[#ff5a5f]", bgColor: "bg-[#ff5a5f]/10" },
    { name: "Mood", icon: Smiley, color: "text-[#007e94]", bgColor: "bg-[#007e94]/10" },
    { name: "Physical", icon: Pulse, color: "text-[#6fd0cd]", bgColor: "bg-[#6fd0cd]/10" },
  ]

  const symptomImages: Record<string, string> = {
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
            <DialogTitle className="text-2xl font-medium tracking-tight">Log Symptoms — Day {activeDay}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground pt-1">
              Select any symptoms or moods you're experiencing today.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 max-h-[440px] overflow-y-auto pr-2 scrollbar-hide">
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
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12 rounded-2xl bg-[var(--mf-accent)] text-white font-medium hover:brightness-110 transition-all shadow-none"
            >
              Save Log
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

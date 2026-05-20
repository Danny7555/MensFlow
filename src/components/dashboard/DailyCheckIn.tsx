import { useState } from "react"
import { format } from "date-fns"
import { useStore } from "@/store/useStore"
import { SYMPTOM_DEFS, type SymptomDef } from "@/data/symptomsData"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Check, Question, Trophy } from "@phosphor-icons/react"

// Map symptom IDs to local image assets
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

interface SymptomBubbleProps {
  sym: SymptomDef
  active: boolean
  onClick: () => void
}

/**
 * Individual symptom bubble button
 */
function SymptomBubble({ sym, active, onClick }: SymptomBubbleProps) {
  const imgUrl = symptomImages[sym.id]

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-3 min-w-[76px] transition-all duration-300 active:scale-95 outline-none",
        active ? "scale-102" : ""
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center relative transition-all overflow-hidden border-2",
        active ? "border-[var(--mf-accent)]" : "border-transparent"
      )}>
        {imgUrl ? (
          <img src={imgUrl} alt={sym.label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center font-bold text-xs uppercase text-muted-foreground">
            {sym.label.substring(0, 2)}
          </div>
        )}
        {active && (
          <div className="absolute inset-0 bg-[var(--mf-accent)]/20 flex items-center justify-center">
            <div className="bg-white text-[var(--mf-accent)] rounded-full p-0.5 shadow-sm">
              <Check size={10} weight="bold" />
            </div>
          </div>
        )}
      </div>
      <span className={cn(
        "text-[11px] font-medium text-center truncate w-full",
        active ? "text-[var(--mf-accent)]" : "text-[var(--mf-text-strong)]"
      )}>
        {sym.label}
      </span>
    </button>
  )
}

/**
 * Quiz module option button
 */
interface QuizOptionProps {
  text: string
  selected: boolean
  showResult: boolean
  correct: boolean
  onClick: () => void
}

function QuizOption({ text, selected, showResult, correct, onClick }: QuizOptionProps) {
  return (
    <button
      type="button"
      disabled={showResult}
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-xl border text-xs font-normal transition-all duration-200 outline-none",
        selected
          ? correct 
            ? "bg-green-50/70 dark:bg-green-950/20 border-green-500 text-green-700 dark:text-green-400"
            : "bg-red-50/70 dark:bg-red-950/20 border-red-500 text-red-700 dark:text-red-400"
          : "bg-muted/20 border-border/50 hover:bg-muted/50 text-[var(--mf-text-strong)]"
      )}
    >
      <div className="flex items-center justify-between">
        <span>{text}</span>
        {selected && (
          <span className="font-medium uppercase tracking-wider text-[9px] px-1.5 py-0.5 rounded bg-white dark:bg-muted/40">
            {correct ? "Correct" : "Wrong"}
          </span>
        )}
      </div>
    </button>
  )
}

export function SymptomLogger() {
  const { addLog, getLogForDate, isSaving } = useStore()
  const todayDate = format(new Date(), 'yyyy-MM-dd')
  const existingLog = getLogForDate(todayDate)
  const currentSymptoms = existingLog ? existingLog.symptoms : []

  const checkInSymptoms = SYMPTOM_DEFS.filter(sym => sym.category !== 'Flow')

  const toggleSymptom = async (id: string, label: string) => {
    if (isSaving) return
    let next: string[]
    if (currentSymptoms.includes(id)) {
      next = currentSymptoms.filter(s => s !== id)
      toast.success("Symptom updated", {
        description: `Removed "${label}" from today's log.`,
        duration: 3000,
      })
    } else {
      next = [...currentSymptoms, id]
      toast.success("Symptom logged", {
        description: `Added "${label}" to today's log.`,
        duration: 3000,
      })
    }
    await addLog(todayDate, next)
  }

  return (
    <div className="flo-card flo-card--prominent overflow-hidden flex flex-col justify-between mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium text-[var(--mf-text-strong)] tracking-tight">How is your day going?</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-5">Tap to record your current symptoms or moods instantly. Your daily trends will update automatically.</p>
        
        <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
          {checkInSymptoms.map((sym) => (
            <SymptomBubble
              key={sym.id}
              sym={sym}
              active={currentSymptoms.includes(sym.id)}
              onClick={() => toggleSymptom(sym.id, sym.label)}
            />
          ))}
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-[var(--mf-border)] flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Logged today: <span className="font-medium text-[var(--mf-text-strong)]">{currentSymptoms.length}</span> symptoms</span>
        <span className="opacity-50">Flo App Sync Active</span>
      </div>
    </div>
  )
}

export function DailyQuiz() {
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null)

  const quiz = {
    question: "Progesterone levels rise post-ovulation. How does this hormone typically affect your rest cycle?",
    options: [
      { id: 1, text: "Promotes deep sleep and calms the brain", correct: true },
      { id: 2, text: "Causes hyperactivity and shortens REM cycles", correct: false }
    ],
    explanation: "Correct! Progesterone has a natural soothing, calming effect on the GABA receptors in the brain, helping promote deeper rest, although high spikes can sometimes lead to daytime fatigue."
  }

  return (
    <div className="flo-card flo-card--featured flex flex-col justify-between overflow-hidden mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="flo-card-icon flo-card-icon--pink">
            <Question size={20} weight="bold" />
          </div>
          <h3 className="text-lg font-medium text-[var(--mf-text-strong)] tracking-tight">Daily Quiz</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Learn about your body. Tapping your answer updates your check-in score.</p>
        
        <p className="text-xs font-normal text-[var(--mf-text-strong)] leading-relaxed mb-4">{quiz.question}</p>
        
        <div className="flex flex-col gap-2">
          {quiz.options.map((opt) => (
            <QuizOption
              key={opt.id}
              text={opt.text}
              selected={selectedQuizAnswer === opt.id}
              showResult={selectedQuizAnswer !== null}
              correct={opt.correct}
              onClick={() => {
                setSelectedQuizAnswer(opt.id)
                if (opt.correct) {
                  toast.success("Correct answer!", {
                    icon: <Trophy size={18} className="text-amber-500" />,
                    description: "+10 points added to your wellness insights."
                  })
                } else {
                  toast.error("Incorrect answer", {
                    description: "Try again tomorrow!"
                  })
                }
              }}
            />
          ))}
        </div>

        {selectedQuizAnswer !== null && (
          <div className="mt-4 p-3 bg-muted/30 border border-border/40 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              {selectedQuizAnswer === 1 ? quiz.explanation : "Progesterone is a natural relaxant. High levels after ovulation promote restorative rest and calm GABA receptors."}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-[var(--mf-border)] flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Weekly Streak: <span className="font-medium text-[var(--mf-text-strong)]">5 Days</span></span>
        <span className="text-[var(--mf-accent)] font-medium flex items-center gap-1">
          <Trophy size={12} weight="fill" /> +50 pts
        </span>
      </div>
    </div>
  )
}

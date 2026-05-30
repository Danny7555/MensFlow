import { useState, useMemo } from "react"
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
  'life-sleep': '/images/sleep_3d.png',
  'life-bbt': '/images/bbt_3d.png',
  'life-sex': '/images/sex_3d.png',
  'life-pill': '/images/pill_3d.png',
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
        "flex flex-col items-center gap-2 p-3 min-w-[76px] transition-all duration-300 active:scale-95 outline-none group",
        active ? "scale-102" : ""
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center relative transition-all overflow-hidden border-2 group-hover:scale-110",
        active ? "border-[var(--mf-accent)]" : "border-transparent group-hover:border-[var(--mf-accent)]"
      )}>
        {imgUrl ? (
          <img src={imgUrl} alt={sym.label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center font-normal text-xs uppercase text-muted-foreground group-hover:text-[var(--mf-accent)] transition-colors">
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
        "text-[10px] font-normal text-center whitespace-normal text-balance leading-tight w-[76px] transition-colors",
        active ? "text-[var(--mf-accent)]" : "text-[var(--mf-text-strong)] group-hover:text-[var(--mf-accent)]"
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
        "w-full text-left p-4 rounded-xl border text-[13px] md:text-sm font-normal transition-all duration-200 outline-none",
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
          <span className="font-normal uppercase tracking-wider text-[9px] px-1.5 py-0.5 rounded bg-white dark:bg-muted/40">
            {correct ? "Correct" : "Wrong"}
          </span>
        )}
      </div>
    </button>
  )
}

export function SymptomLogger() {
  const { addLog, getLogForDate, isSaving, customSymptoms } = useStore()
  const [showAll, setShowAll] = useState(false)
  const todayDate = format(new Date(), 'yyyy-MM-dd')
  const existingLog = getLogForDate(todayDate)
  const currentSymptoms = existingLog ? existingLog.symptoms : []

  const checkInSymptoms = [...SYMPTOM_DEFS, ...customSymptoms].filter(sym => sym.category !== 'Flow')

  const displayedSymptoms = useMemo(() => {
    if (showAll) return checkInSymptoms
    // Always keep active/logged symptoms visible first, then pad with inactive ones up to a limit of 12
    const active = checkInSymptoms.filter(sym => currentSymptoms.includes(sym.id))
    const inactive = checkInSymptoms.filter(sym => !currentSymptoms.includes(sym.id))
    const combined = [...active, ...inactive]
    return combined.slice(0, 12)
  }, [checkInSymptoms, currentSymptoms, showAll])

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
    <div className="flo-card flo-card--prominent overflow-hidden flex flex-col justify-between h-full animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-normal text-[var(--mf-text-strong)] tracking-tight">How is your day going?</h3>
          {checkInSymptoms.length > 12 && (
            <button 
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="text-xs text-[var(--mf-accent)] hover:underline cursor-pointer font-normal border-none bg-transparent p-0 outline-none"
            >
              {showAll ? "Show less" : "See all"}
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-5">Tap to record your current symptoms or moods instantly. Your daily trends will update automatically.</p>

        <div className="flex flex-wrap justify-start gap-3 pb-4">
          {displayedSymptoms.map((sym) => (
            <div key={sym.id} className="flex-none">
              <SymptomBubble
                sym={sym}
                active={currentSymptoms.includes(sym.id)}
                onClick={() => toggleSymptom(sym.id, sym.label)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[var(--mf-border)] flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Logged today: <span className="font-normal text-[var(--mf-text-strong)]">{currentSymptoms.length}</span> symptoms</span>
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
    <div className="flo-card border border-[var(--mf-border)] bg-gradient-to-br from-card to-[var(--mf-accent-soft)]/10 flex flex-col justify-between overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 !shadow-none">
      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="size-10 rounded-xl bg-[var(--mf-accent-soft)] flex items-center justify-center text-[var(--mf-accent)]">
            <Question size={22} weight="bold" />
          </div>
          <h3 className="text-xl font-medium text-[var(--mf-text-strong)] tracking-tight">Daily Quiz</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-5">Learn about your body. Tapping your answer updates your check-in score.</p>

        <p className="text-[15px] font-normal text-[var(--mf-text-strong)] leading-relaxed mb-6">{quiz.question}</p>

        <div className="flex flex-col gap-2.5">
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
          <div className="mt-6 p-4 bg-white/50 dark:bg-black/20 border border-border/30 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-[13px] leading-relaxed text-[var(--mf-text-strong)]">
              {selectedQuizAnswer === 1 ? quiz.explanation : "Progesterone is a natural relaxant. High levels after ovulation promote restorative rest and calm GABA receptors."}
            </p>
          </div>
        )}
      </div>

      <div className="px-6 md:px-8 py-4 bg-muted/20 border-t border-[var(--mf-border)] flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          Weekly Streak: <span className="font-medium text-[var(--mf-text-strong)]">5 Days</span>
        </span>
        <span className="text-[var(--mf-accent)] font-medium flex items-center gap-1.5">
          <Trophy size={14} weight="fill" /> +50 pts
        </span>
      </div>
    </div>
  )
}

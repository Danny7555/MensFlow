import { useState, useMemo, useEffect } from "react"
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
  const { user, submitQuizAttemptAction } = useStore()
  
  const todayDate = format(new Date(), 'yyyy-MM-dd')
  const dbQuizCount = user?.quizLastCompletedAt === todayDate ? (user?.quizCountToday || 0) : 0

  const [activeStep, setActiveStep] = useState<number>(dbQuizCount)
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null)

  // Sync activeStep with DB state ONLY on initial load or when quiz answer is null (meaning not showing explanation)
  useEffect(() => {
    if (selectedQuizAnswer === null) {
      setActiveStep(dbQuizCount)
    }
  }, [dbQuizCount, selectedQuizAnswer])

  const quizzes = [
    {
      question: "Progesterone levels rise post-ovulation. How does this hormone typically affect your rest cycle?",
      options: [
        { id: 1, text: "Promotes deep sleep and calms the brain", correct: true },
        { id: 2, text: "Causes hyperactivity and shortens REM cycles", correct: false }
      ],
      explanation: "Correct! Progesterone has a natural soothing, calming effect on the GABA receptors in the brain, helping promote deeper rest, although high spikes can sometimes lead to daytime fatigue.",
      incorrectExplanation: "Progesterone is a natural relaxant. High levels after ovulation promote restorative rest and calm GABA receptors."
    },
    {
      question: "Estrogen levels peak right before ovulation. What is the primary psychological and physical effect of this peak?",
      options: [
        { id: 1, text: "Boosts physical energy, positive mood, and social confidence", correct: true },
        { id: 2, text: "Induces anxiety, physical relaxation, and social withdrawal", correct: false }
      ],
      explanation: "Correct! Estrogen peaks in the late follicular phase (just before ovulation), boosting serotonin and dopamine to enhance energy, libido, mood, and social confidence.",
      incorrectExplanation: "Estrogen peak actually drives energy, positive mood, and confidence rather than anxiety or withdrawal."
    }
  ]

  const currentQuiz = activeStep < 2 ? quizzes[activeStep] : null

  const handleOptionClick = async (opt: { id: number; correct: boolean }) => {
    setSelectedQuizAnswer(opt.id)
    await submitQuizAttemptAction(todayDate, opt.correct)
    if (opt.correct) {
      toast.success("Correct answer!", {
        icon: <Trophy size={18} className="text-amber-500" />,
        description: "+50 XP added to your wellness insights."
      })
    } else {
      toast.error("Incorrect answer", {
        description: "Review the explanation below to learn more!"
      })
    }
  }

  const handleNext = () => {
    setSelectedQuizAnswer(null)
  }

  return (
    <div className="flo-card border border-[var(--mf-border)] bg-gradient-to-br from-card to-[var(--mf-accent-soft)]/10 flex flex-col justify-between overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 !shadow-none">
      <div className={cn("p-6 md:p-8", !currentQuiz && "p-5 md:p-6 pb-4")}>
        <div className={cn("flex items-center gap-3", currentQuiz ? "mb-3" : "mb-2")}>
          <div className="size-10 rounded-xl bg-[var(--mf-accent-soft)] flex items-center justify-center text-[var(--mf-accent)]">
            <Question size={22} weight="bold" />
          </div>
          <h3 className="text-xl font-medium text-[var(--mf-text-strong)] tracking-tight">Daily Quiz</h3>
        </div>

        {currentQuiz ? (
          <>
            <div className="flex justify-between items-center mb-5">
              <p className="text-sm text-muted-foreground">Learn about your body. Quiz {activeStep + 1} of 2.</p>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--mf-accent-soft)] text-[var(--mf-accent)]">
                Attempt {activeStep + 1}
              </span>
            </div>

            <p className="text-[15px] font-normal text-[var(--mf-text-strong)] leading-relaxed mb-6">{currentQuiz.question}</p>

            <div className="flex flex-col gap-2.5">
              {currentQuiz.options.map((opt) => (
                <QuizOption
                  key={opt.id}
                  text={opt.text}
                  selected={selectedQuizAnswer === opt.id}
                  showResult={selectedQuizAnswer !== null}
                  correct={opt.correct}
                  onClick={() => handleOptionClick(opt)}
                />
              ))}
            </div>

            {selectedQuizAnswer !== null && (
              <div className="mt-6 p-4 bg-white/50 dark:bg-black/20 border border-border/30 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-[13px] leading-relaxed text-[var(--mf-text-strong)]">
                  {selectedQuizAnswer === currentQuiz.options.find(o => o.correct)?.id 
                    ? currentQuiz.explanation 
                    : currentQuiz.incorrectExplanation}
                </p>
              </div>
            )}

            {selectedQuizAnswer !== null && (
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-4 py-2 bg-[var(--mf-accent)] text-white hover:bg-[var(--mf-accent)]/90 transition-all rounded-xl text-sm font-medium outline-none cursor-pointer"
                >
                  {activeStep === 0 ? "Take Next Quiz →" : "Finish"}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-2 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="size-10 rounded-full bg-green-50 dark:bg-green-950/20 flex items-center justify-center text-green-500 mx-auto mb-2">
              <Check size={20} weight="bold" />
            </div>
            <h4 className="text-base font-medium text-[var(--mf-text-strong)] mb-0.5">All daily quizzes completed!</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-normal">
              You have completed both of your quizzes for today. Come back tomorrow to test your knowledge and earn more XP!
            </p>
          </div>
        )}

        {/* XP Progress Bar towards 500 XP */}
        <div className={cn("pt-4 border-t border-[var(--mf-border)]/50", currentQuiz ? "mt-6" : "mt-3")}>
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-medium text-[var(--mf-text-strong)]">AI Assistant Unlock Progress</span>
            <span className="text-[var(--mf-accent)] font-semibold">{(user?.xp || 0)} / 500 XP</span>
          </div>
          <div className="w-full bg-muted/40 h-2.5 rounded-full overflow-hidden border border-border/20 relative">
            <div 
              className="bg-gradient-to-r from-pink-500 to-[var(--mf-accent)] h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(100, ((user?.xp || 0) / 500) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 leading-normal">
            {(user?.xp || 0) >= 500 
              ? "🎉 Congratulations! You have unlocked unlimited AI assistant chat access." 
              : `Earn ${500 - (user?.xp || 0)} more XP by completing quizzes to unlock full AI chat access.`
            }
          </p>
        </div>
      </div>

      <div className={cn("px-6 md:px-8 py-4 bg-muted/20 border-t border-[var(--mf-border)] flex items-center justify-between text-xs text-muted-foreground", !currentQuiz && "px-5 md:px-6 py-3")}>
        <span className="flex items-center gap-1.5">
          Weekly Streak: <span className="font-medium text-[var(--mf-text-strong)]">5 Days</span>
        </span>
        <span className="text-[var(--mf-accent)] font-medium flex items-center gap-1.5">
          <Trophy size={14} weight="fill" /> {(user?.xp || 0)} XP Total
        </span>
      </div>
    </div>
  )
}

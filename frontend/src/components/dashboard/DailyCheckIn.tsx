import { useMemo, useState } from "react"
import { format } from "date-fns"
import { useStore } from "@/store/useStore"
import { SYMPTOM_DEFS, type SymptomDef } from "@/data/symptomsData"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Check, Question, Trophy, Drop } from "@phosphor-icons/react"
import { buildPersonalizationProfile } from "@/lib/personalization"
import { computeCycleDay, getPhaseFromDay } from "@/lib/cycleUtils"

// Map symptom IDs to local image assets
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
        "flex w-full min-w-0 flex-col items-center gap-1 md:gap-2 p-2 md:p-3 transition-all duration-300 active:scale-95 outline-none group",
        active ? "scale-102" : ""
      )}
    >
      <div className={cn(
        "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center relative transition-all overflow-hidden border-2 group-hover:scale-110",
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
        "text-[9px] md:text-[10px] font-normal text-center whitespace-normal text-balance leading-tight w-full max-w-[76px] transition-colors",
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

const EMPTY_ARRAY: string[] = []

export function SymptomLogger() {
  const { addLog, getLogForDate, isSaving, customSymptoms } = useStore()
  const [showAll, setShowAll] = useState(false)
  const todayDate = format(new Date(), 'yyyy-MM-dd')
  const existingLog = getLogForDate(todayDate)
  const currentSymptoms = existingLog?.symptoms ?? EMPTY_ARRAY
  const checkInSymptoms = [...SYMPTOM_DEFS, ...customSymptoms].filter(sym => sym.category !== 'Flow')
  const displayedSymptoms = (() => {
    if (showAll) return checkInSymptoms
    // Always keep active/logged symptoms visible first, then pad with inactive ones.
    const active = checkInSymptoms.filter(sym => currentSymptoms.includes(sym.id))
    const inactive = checkInSymptoms.filter(sym => !currentSymptoms.includes(sym.id))
    const combined = [...active, ...inactive]
    return combined.slice(0, 18)
  })()

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

  const toggleFlow = async (flowId: string) => {
    if (isSaving) return
    let next: string[]
    const otherFlows = ['flow-light', 'flow-medium', 'flow-heavy'].filter(id => id !== flowId)
    
    if (currentSymptoms.includes(flowId)) {
      // Toggle off
      next = currentSymptoms.filter(s => s !== flowId)
      toast.success("Flow updated", {
        description: "Removed flow log for today.",
        duration: 3000,
      })
    } else {
      // Toggle on, remove other flows
      next = [...currentSymptoms.filter(s => !otherFlows.includes(s)), flowId]
      toast.success("Flow updated", {
        description: `Logged ${flowId.replace('flow-', '')} flow for today.`,
        duration: 3000,
      })
    }
    await addLog(todayDate, next)
  }

  const loggedSymptomsList = [...SYMPTOM_DEFS, ...customSymptoms].filter(s => currentSymptoms.includes(s.id))

  return (
    <div className="flo-card flo-card--prominent overflow-hidden flex flex-col justify-between h-full animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="text-base md:text-lg font-normal text-[var(--mf-text-strong)] tracking-tight leading-tight">How is your day going?</h3>
          {checkInSymptoms.length > 18 && (
            <button 
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="text-xs text-[var(--mf-accent)] hover:underline cursor-pointer font-normal border-none bg-transparent p-0 outline-none flex-shrink-0 whitespace-nowrap"
            >
              {showAll ? "Show less" : "See all"}
            </button>
          )}
        </div>
        <p className="text-xs md:text-xs text-muted-foreground mb-3 md:mb-5 leading-relaxed">Tap to record your current symptoms or moods instantly. Your daily trends will update automatically.</p>

        {/* Flow Intensity Quick Log */}
        <div className="mb-5 pb-4 border-b border-[var(--mf-border)]">
          <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-wider block mb-2">Today's Flow</span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'flow-light', label: 'Light', color: 'hover:border-rose-300 active:bg-rose-100/50' },
              { id: 'flow-medium', label: 'Medium', color: 'hover:border-rose-400 active:bg-rose-100' },
              { id: 'flow-heavy', label: 'Heavy', color: 'hover:border-red-500 active:bg-red-100' },
            ].map((flowOpt) => {
              const isActive = currentSymptoms.includes(flowOpt.id)
              return (
                <button
                  key={flowOpt.id}
                  type="button"
                  onClick={() => toggleFlow(flowOpt.id)}
                  className={cn(
                    "py-2 px-3 rounded-xl border text-xs font-normal transition-all flex items-center justify-center gap-1.5 cursor-pointer outline-none",
                    isActive
                      ? (flowOpt.id === 'flow-heavy' 
                          ? "bg-red-500/10 text-red-500 border-red-500 font-medium dark:bg-red-500/20" 
                          : "bg-rose-500/10 text-rose-500 border-rose-500 font-medium dark:bg-rose-500/20")
                      : "bg-card text-muted-foreground border-border hover:border-[var(--mf-accent)]"
                  )}
                >
                  <Drop size={12} weight={isActive ? "fill" : "regular"} className={isActive ? (flowOpt.id === 'flow-heavy' ? "text-red-500" : "text-rose-500") : "text-muted-foreground"} />
                  <span>{flowOpt.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-wider block mb-2">Symptoms & Moods</span>
        <div className="grid grid-cols-3 gap-2 md:gap-3 pb-4">
          {displayedSymptoms.map((sym) => (
            <SymptomBubble
              key={sym.id}
              sym={sym}
              active={currentSymptoms.includes(sym.id)}
              onClick={() => toggleSymptom(sym.id, sym.label)}
            />
          ))}
        </div>

        {/* Today's Logged Signals Section */}
        {loggedSymptomsList.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[var(--mf-border)]">
            <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-wider block mb-2">Today's Logged Signals</span>
            <div className="flex flex-wrap gap-2">
              {loggedSymptomsList.map((s) => {
                const imgUrl = symptomImages[s.id]
                return (
                  <div
                    key={s.id}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-normal border transition-all",
                      s.id.startsWith('flow-')
                        ? "bg-rose-500/10 text-rose-500 border-rose-500/30"
                        : "bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] border-[var(--mf-accent-border)]"
                    )}
                  >
                    {imgUrl ? (
                      <img src={imgUrl} alt="" className="size-4 rounded-full object-cover shrink-0" />
                    ) : (
                      <span className="size-1.5 rounded-full bg-[var(--mf-accent)] shrink-0" />
                    )}
                    <span>{s.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-[var(--mf-border)] flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Logged today: <span className="font-normal text-[var(--mf-text-strong)]">{currentSymptoms.length}</span> symptoms</span>
      </div>
    </div>
  )
}

export function DailyQuiz() {
  const { user, dashboard, logs, submitQuizAttemptAction } = useStore()
  
  const todayDate = format(new Date(), 'yyyy-MM-dd')
  const dbQuizCount = user?.quizLastCompletedAt === todayDate ? (user?.quizCountToday || 0) : 0

  const [activeStep, setActiveStep] = useState<number>(dbQuizCount)
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null)

  const quizzes = useMemo(() => {
    const profile = buildPersonalizationProfile(user?.onboardingData ?? {})
    const cycleDay = computeCycleDay(dashboard.lastPeriodStart, dashboard.typicalCycleDays)
    const phase = getPhaseFromDay(cycleDay, dashboard.typicalCycleDays)
    const todayLog = logs.find((log) => log.date === todayDate)
    const hasHeavyFlow = profile.flowIntensity === 'heavy' || todayLog?.symptoms.includes('flow-heavy')
    const hasVariableCycle = profile.isAtypical || profile.flowIntensity === 'variable'

    const phaseQuiz =
      phase === 'menstrual'
        ? {
            question: `Day ${cycleDay} looks like a menstrual-phase day. Which input most improves prediction accuracy today?`,
            options: [
              { id: 1, text: "Logging flow level plus symptoms like cramps or fatigue", correct: true },
              { id: 2, text: "Only counting calendar days from the last period", correct: false }
            ],
            explanation: "Correct! Flow and symptoms confirm what the calendar predicts, which makes the daily model more reliable over time.",
            incorrectExplanation: "Calendar day is useful, but flow and symptom logs validate the phase and improve future predictions."
          }
        : phase === 'fertile'
          ? {
              question: `Around Day ${cycleDay}, what signal best supports an ovulation-window estimate?`,
              options: [
                { id: 1, text: "Cervical mucus changes or an LH test trend", correct: true },
                { id: 2, text: "A fixed Day 14 rule for every cycle", correct: false }
              ],
              explanation: "Correct! Ovulation timing shifts with cycle length, so mucus and LH clues are stronger than a fixed Day 14 rule.",
              incorrectExplanation: "Day 14 is only an average. MensFlow estimates ovulation from the cycle length and improves with mucus or LH logs."
            }
          : phase === 'luteal'
            ? {
                question: "Why can sleep, cravings, and mood feel different in the luteal phase?",
                options: [
                  { id: 1, text: "Progesterone rises and body temperature can increase", correct: true },
                  { id: 2, text: "Hormones stay flat until the next period starts", correct: false }
                ],
                explanation: "Correct! Progesterone can feel calming or tiring, and a warmer body temperature can affect sleep quality.",
                incorrectExplanation: "Hormones keep changing in the luteal phase. Progesterone and temperature shifts can affect rest, appetite, and mood."
              }
            : {
                question: "What usually makes follicular-phase planning more accurate?",
                options: [
                  { id: 1, text: "Using the last period date, cycle length, and recent symptoms together", correct: true },
                  { id: 2, text: "Ignoring recent logs once onboarding is complete", correct: false }
                ],
                explanation: "Correct! Onboarding gives the baseline, and daily logs refine it as the cycle unfolds.",
                incorrectExplanation: "Onboarding is only the starting point. Recent logs help MensFlow personalize the current day."
              }

    const profileQuiz = hasHeavyFlow
      ? {
          question: "If flow is heavy, which care cue should the dashboard prioritize?",
          options: [
            { id: 1, text: "Hydration, iron-rich food, rest, and pain tracking", correct: true },
            { id: 2, text: "High-intensity exercise and skipped meals", correct: false }
          ],
          explanation: "Correct! Heavy-flow support should emphasize comfort, hydration, iron, and careful symptom tracking.",
          incorrectExplanation: "Heavy-flow days are better supported with hydration, iron-rich meals, rest, and pain-aware planning."
        }
      : hasVariableCycle
        ? {
            question: "For irregular or variable cycles, what makes predictions more trustworthy?",
            options: [
              { id: 1, text: "Several cycles of daily flow, symptom, LH, or mucus logs", correct: true },
              { id: 2, text: "One fixed cycle length forever", correct: false }
            ],
            explanation: "Correct! Variable cycles need repeated logs so the model can adapt instead of pretending every month is identical.",
            incorrectExplanation: "A fixed cycle length is only a rough fallback. Repeated logs make variable-cycle predictions safer."
          }
        : {
            question: "Why does MensFlow use onboarding answers before enough logs exist?",
            options: [
              { id: 1, text: "They create a personal baseline until real trends accumulate", correct: true },
              { id: 2, text: "They permanently replace daily tracking", correct: false }
            ],
            explanation: "Correct! Onboarding personalizes the first experience, then daily logs gradually become the stronger signal.",
            incorrectExplanation: "Onboarding should not replace daily tracking. It gives the app a better starting point."
          }

    return [phaseQuiz, profileQuiz]
  }, [dashboard.lastPeriodStart, dashboard.typicalCycleDays, logs, todayDate, user?.onboardingData])

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
    setActiveStep(dbQuizCount)
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

        {/* XP Progress Bar towards 100 XP */}
        <div className={cn("pt-4 border-t border-[var(--mf-border)]/50", currentQuiz ? "mt-6" : "mt-3")}>
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-medium text-[var(--mf-text-strong)]">AI Assistant Unlock Progress</span>
            <span className="text-[var(--mf-accent)] font-semibold">{(user?.xp || 0)} / 100 XP</span>
          </div>
          <div className="w-full bg-muted/40 h-2.5 rounded-full overflow-hidden border border-border/20 relative">
            <div 
              className="bg-gradient-to-r from-pink-500 to-[var(--mf-accent)] h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(100, ((user?.xp || 0) / 100) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 leading-normal">
            {(user?.xp || 0) >= 100 
              ? "🎉 Congratulations! You have unlocked unlimited AI assistant chat access." 
              : `Earn ${100 - (user?.xp || 0)} more XP by completing quizzes to unlock full AI chat access.`
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

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { useStore } from "@/store/useStore"
import { SYMPTOM_DEFS, type SymptomDef } from "@/data/symptomsData"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Check, Trophy, Drop, Sparkle, SealCheck, ArrowRight, Brain, Star, Fire } from "@phosphor-icons/react"
import { buildPersonalizationProfile } from "@/lib/personalization"
import { computeCycleDay, getPhaseFromDay } from "@/lib/cycleUtils"

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
          <img loading="lazy" src={imgUrl} alt={sym.label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center font-normal text-xs uppercase text-muted-foreground group-hover:text-[var(--mf-accent)] transition-colors">
            {sym.label.substring(0, 2)}
          </div>
        )}
        {active && (
          <div className="absolute inset-0 bg-[var(--mf-accent)]/20 flex items-center justify-center">
            <div className="bg-white text-[var(--mf-accent)] rounded-full p-0.5">
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
        "w-full text-left p-3.5 rounded-xl border text-xs md:text-sm font-normal transition-all duration-200 outline-none flex items-start gap-2.5",
        selected
          ? correct
            ? "bg-green-50/70 dark:bg-green-950/20 border-green-500 text-green-700 dark:text-green-400"
            : "bg-red-50/70 dark:bg-red-950/20 border-red-500 text-red-700 dark:text-red-400"
          : "bg-muted/20 border-border/50 hover:bg-muted/50 hover:border-[var(--mf-accent-border)] text-[var(--mf-text-strong)]"
      )}
    >
      <span className={cn(
        "size-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors",
        selected
          ? correct
            ? "border-green-500 bg-green-500 text-white"
            : "border-red-500 bg-red-500 text-white"
          : "border-[var(--mf-muted)] group-hover:border-[var(--mf-accent)]"
      )}>
        {selected && <Check size={10} weight="bold" />}
      </span>
      <div className="flex-1 min-w-0">
        <span>{text}</span>
        {selected && (
          <span className={cn(
            "inline-block ml-1.5 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded",
            correct ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-red-500/10 text-red-600 dark:text-red-400"
          )}>
            {correct ? "Correct" : "Incorrect"}
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
      next = currentSymptoms.filter(s => s !== flowId)
      toast.success("Flow updated", {
        description: "Removed flow log for today.",
        duration: 3000,
      })
    } else {
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
                      <img loading="lazy" src={imgUrl} alt="" className="size-4 rounded-full object-cover shrink-0" />
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
              question: `Around day ${cycleDay}, what signal best supports an ovulation-window estimate?`,
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
    <div className="flo-card border border-[var(--mf-border)] bg-card flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 !p-0">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[var(--mf-border)]">
        <div className="size-9 rounded-xl bg-gradient-to-br from-[var(--mf-accent-soft)] to-[var(--mf-accent-soft)]/60 flex items-center justify-center text-[var(--mf-accent)]">
          <Brain size={18} weight="bold" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--mf-text-strong)] tracking-tight">Daily Quiz</h3>
          <p className="text-[10px] text-muted-foreground">Test your cycle knowledge</p>
        </div>
      </div>

      <div className={cn("p-5", !currentQuiz && "pb-4")}>
        {currentQuiz ? (
          <>
            {/* Quiz progress + attempt indicator */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {[0, 1].map((step) => (
                  <div key={step} className="flex items-center gap-1.5">
                    <div className={cn(
                      "size-7 rounded-lg flex items-center justify-center text-[11px] font-semibold transition-all",
                      step < activeStep
                        ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                        : step === activeStep
                          ? "bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] border border-[var(--mf-accent-border)]"
                          : "bg-muted/30 text-muted-foreground border border-[var(--mf-border)]"
                    )}>
                      {step < activeStep ? <SealCheck size={14} weight="fill" /> : step + 1}
                    </div>
                    {step === 0 && <ArrowRight size={14} className="text-muted-foreground/40" weight="bold" />}
                  </div>
                ))}
              </div>
              <span className={cn(
                "text-[10px] font-semibold px-2.5 py-0.5 rounded-full border",
                selectedQuizAnswer !== null
                  ? "bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] border-[var(--mf-accent-border)]"
                  : "bg-muted/30 text-muted-foreground border-[var(--mf-border)]"
              )}>
                {selectedQuizAnswer !== null ? "Answered" : "Attempt " + (activeStep + 1)}
              </span>
            </div>

            {/* Question */}
            <div className="mb-4">
              <p className="text-sm font-medium text-[var(--mf-text-strong)] leading-relaxed">
                {currentQuiz.question}
              </p>
            </div>

            {/* Options */}
            <div className="flex flex-col gap-2">
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

            {/* Explanation */}
            {selectedQuizAnswer !== null && (
              <div className="mt-4 p-4 rounded-xl border bg-[var(--mf-card)] border-[var(--mf-border)] animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-start gap-2.5">
                  <div className={cn(
                    "size-7 rounded-lg flex items-center justify-center shrink-0",
                    selectedQuizAnswer === currentQuiz.options.find(o => o.correct)?.id
                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  )}>
                    <Sparkle size={15} weight="fill" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--mf-text-strong)] mb-0.5">
                      {selectedQuizAnswer === currentQuiz.options.find(o => o.correct)?.id
                        ? "Great job!"
                        : "Not quite — here's why:"}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {selectedQuizAnswer === currentQuiz.options.find(o => o.correct)?.id 
                        ? currentQuiz.explanation 
                        : currentQuiz.incorrectExplanation}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Next / Finish button */}
            {selectedQuizAnswer !== null && (
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleNext}
                  className="rounded-lg h-8 text-xs gap-1"
                  size="sm"
                >
                  {activeStep === 0 ? (
                    <>Next Quiz <ArrowRight size={14} weight="bold" /></>
                  ) : (
                    <>Finish <SealCheck size={14} weight="bold" /></>
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          /* Completed state */
          <div className="py-4 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="size-12 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 flex items-center justify-center text-green-500 mx-auto mb-3 border border-green-500/20">
              <SealCheck size={24} weight="fill" />
            </div>
            <h4 className="text-sm font-semibold text-[var(--mf-text-strong)] mb-0.5">All done for today!</h4>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
              You completed both quizzes. Come back tomorrow to keep learning and earning XP.
            </p>
          </div>
        )}

        {/* XP Progress */}
        <div className={cn("pt-4 border-t border-[var(--mf-border)]", currentQuiz ? "mt-4" : "mt-3")}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-medium text-[var(--mf-text-strong)] flex items-center gap-1">
              <Star size={12} className="text-amber-500" weight="fill" />
              AI Assistant Unlock Progress
            </span>
            <span className="text-[10px] font-bold text-[var(--mf-accent)] tabular-nums">{Math.min(user?.xp || 0, 100)} / 100 XP</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden bg-muted/40 border border-[var(--mf-border)]/20">
            <div 
              className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-pink-500 to-[var(--mf-accent)]"
              style={{ width: `${Math.min(100, ((user?.xp || 0) / 100) * 100)}%` }}
            />
          </div>
          <p className="text-[9px] text-muted-foreground mt-1 leading-relaxed">
            {(user?.xp || 0) >= 100 
              ? <span className="flex items-center gap-1"><Sparkle size={10} className="text-amber-500" weight="fill" /> Unlocked! Unlimited AI chat access is active.</span>
              : <span>Earn {100 - (user?.xp || 0)} more XP from quizzes to unlock unlimited AI chat.</span>
            }
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-muted/20 border-t border-[var(--mf-border)] flex items-center justify-between text-[10px]">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Fire size={12} className="text-orange-500" weight="fill" />
          Weekly Streak: <span className="font-semibold text-[var(--mf-text-strong)]">5 Days</span>
        </span>
        <span className="flex items-center gap-1 text-[var(--mf-accent)] font-semibold">
          <Trophy size={12} weight="fill" />
          {(user?.xp || 0)} XP Total
        </span>
      </div>
    </div>
  )
}

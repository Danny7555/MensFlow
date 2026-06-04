import { m } from "framer-motion"
import type { Variants } from "framer-motion"
import { 
  Sparkle, 
  Target, 
  Plus, 
  Check, 
  CaretRight, 
  Users, 
  Popcorn, 
  CookingPot, 
  Question, 
  Coffee, 
  Sun, 
  Calendar, 
  Lightbulb, 
  Martini, 
  Heart, 
  Flower
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { useStore } from "../../store/useStore"
import { getPhaseTasks } from "../../lib/cycleUtils"
import { toast } from "sonner"

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
}

const INSIGHTS_BY_PHASE: Record<string, string> = {
  menstrual: "Estrogen and progesterone are at their lowest. The body is shedding the uterine lining, requiring higher iron intake and rest.",
  follicular: "Estrogen levels are steadily rising, boosting physical stamina, mental clarity, and social confidence.",
  ovulatory: "Estrogen and luteinizing hormone peak. This is the optimal window for energy, social connection, and collaboration.",
  fertile: "Estrogen and luteinizing hormone peak. This is the optimal window for energy, social connection, and collaboration.",
  luteal: "Progesterone is dominant, naturally increasing your metabolic rate and nesting behaviors. You might experience lower energy or cravings."
}

const METRICS_BY_PHASE: Record<string, string> = {
  menstrual: "ESTROGEN & PROGESTERONE LOW",
  follicular: "ESTROGEN RISING",
  ovulatory: "LH & ESTROGEN PEAK",
  fertile: "LH & ESTROGEN PEAK",
  luteal: "PROGESTERONE ACTIVE"
}

export function PrimaryInsightCard({ label, currentDay, trend }: { label: string; currentDay: number; trend: string }) {
  const normalized = (label || '').toLowerCase()
  const description = normalized
    ? (INSIGHTS_BY_PHASE[normalized] || INSIGHTS_BY_PHASE.luteal)
    : "No cycle tracking setup found. Set your partner's period details to display hormonal peak indicators and phase descriptions."
  const metric = normalized
    ? (METRICS_BY_PHASE[normalized] || METRICS_BY_PHASE.luteal)
    : "NO CYCLE DATA SET"

  return (
    <m.div variants={itemVariants} className="flo-card flo-card--prominent overflow-hidden group h-full">
      <div className="flex flex-col h-full">
        <div className="-mx-6 -mt-6 mb-4 h-[100px] relative shrink-0 overflow-hidden">
          <img 
            src="/images/track.png" alt="Phase" className="w-full h-full object-cover object-center" 
          />
        </div>
        <div className="flo-card-top relative z-10">
          <div className="flex items-center gap-2">
            <div className="flo-card-icon flo-card-icon--accent">
              <Sparkle size={20} weight="fill" />
            </div>
            <p className="flo-card-title !mb-0">{label} Phase</p>
          </div>
          <span className="text-[10px] bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] px-2.5 py-1 rounded-full font-normal">DAY {currentDay}</span>
        </div>
        <div className="mt-2 relative z-10 flex flex-col flex-1">
          <div className="flex-1">
            <h3 className="flo-card-desc text-xl tracking-tight">{trend}</h3>
            <p className="text-[0.85rem] text-[var(--mf-muted)] mt-2 leading-relaxed">
              {description}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[var(--mf-border)] flex items-center justify-between">
            <span className="text-xs font-normal opacity-60">{metric}</span>
            <div className="flex gap-2">
              {['m1', 'm2', 'm3'].map(id => (
                <div 
                   key={id} 
                   className="size-6 rounded-full border border-[var(--mf-card)] bg-[var(--mf-accent-soft)]" 
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </m.div>
  )
}

const FOCUS_BY_PHASE: Record<string, string[]> = {
  menstrual: ['Rest Comfort', 'Heat Therapy'],
  follicular: ['Strength Train', 'Goal Setting'],
  ovulatory: ['HIIT Workout', 'Socialize'],
  fertile: ['HIIT Workout', 'Socialize'],
  luteal: ['Hydrate Extra', 'Light Stretch']
}

export function BodySignalsCard({ signals, currentDay, phaseLabel }: { signals: string; currentDay: number; phaseLabel: string }) {
  const normalized = (phaseLabel || '').toLowerCase()
  const focusAreas = normalized
    ? (FOCUS_BY_PHASE[normalized] || FOCUS_BY_PHASE.luteal)
    : ['Setup Tracking', 'Log Cycle']

  return (
    <m.div variants={itemVariants} className="flo-card flo-card--prominent overflow-hidden group h-full">
      <div className="flex flex-col h-full">
        <div className="-mx-6 -mt-6 mb-4 h-[100px] relative shrink-0 overflow-hidden">
          <img 
            src="/images/calm.jpg" alt="Body Signals" className="w-full h-full object-cover" 
          />
        </div>
        <div className="flo-card-top relative z-10">
          <div className="flo-card-icon flo-card-icon--pink">
            <Target size={20} weight="fill" />
          </div>
        </div>
        <div className="mt-2 relative z-10 flex flex-col flex-1">
          <div className="flex-1">
            <p className="flo-card-title">Body Signals</p>
            <h3 className="flo-card-desc text-lg">{signals}</h3>
            <p className="text-xs opacity-50 mt-2">Common for Day {currentDay}</p>
          </div>
          <div className="mt-4 pt-3 border-t border-[var(--mf-border)] relative z-10">
            <span className="text-[9px] font-normal text-muted-foreground uppercase tracking-wider block mb-1.5">Focus Areas</span>
            <div className="flex flex-wrap gap-1">
              {focusAreas.map((area, idx) => (
                <span key={area} className={cn(
                  "text-[10px] px-2 py-0.5 rounded-md font-normal",
                  idx === 0 ? "bg-[var(--mf-accent-soft)] text-[var(--mf-accent)]" : "bg-muted text-[var(--mf-text-strong)]"
                )}>
                  {area}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </m.div>
  )
}

export function WellnessScoreCard() {
  const { logs, user, partnerStatus } = useStore()
  const todayStr = new Date().toLocaleDateString('en-CA')
  const todayLog = logs.find(l => l.date === todayStr)
  
  const hasLoggedToday = user?.role === 'partner' 
    ? !!(partnerStatus?.cycle?.symptoms && partnerStatus.cycle.symptoms.length > 0)
    : !!(todayLog?.symptoms && todayLog.symptoms.length > 0)

  const symptoms = user?.role === 'partner' && partnerStatus?.cycle?.symptoms
    ? partnerStatus.cycle.symptoms
    : (todayLog?.symptoms ?? [])

  if (!hasLoggedToday) {
    return (
      <m.div variants={itemVariants} className="flo-card flo-card--prominent overflow-hidden group h-full">
        <div className="flex flex-col h-full">
          <div className="-mx-6 -mt-6 mb-4 h-[100px] relative shrink-0 overflow-hidden bg-card">
            <img src="/images/heart.png" alt="Wellness" className="w-full h-full object-cover" />
          </div>
          <div className="flo-card-top relative z-10">
            <div className="flo-card-icon flo-card-icon--pink flex items-center justify-center">
              <img src="/images/heart.png" alt="" className="size-5 object-contain" />
            </div>
          </div>
          <div className="mt-2 relative z-10 flex flex-col flex-1">
            <div className="flex-1">
              <p className="flo-card-title">Wellness Score</p>
              <div className="flex items-end gap-1">
                <h3 className="flo-card-desc text-2xl font-normal text-muted-foreground">—</h3>
                <span className="text-xs mb-1.5 font-normal text-muted-foreground opacity-60">/100</span>
              </div>
              <div className="w-full h-1.5 bg-[var(--mf-border)] rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-muted rounded-full w-0" />
              </div>
              <p className="text-xs text-[var(--mf-muted)] mt-4 leading-relaxed">
                {user?.role === 'partner' 
                  ? "Your partner hasn't logged any symptoms today yet." 
                  : "Log today's symptoms, mood, or sleep to calculate your daily wellness score."}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--mf-border)] relative z-10 grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="opacity-80 block uppercase tracking-wider text-[8px] font-normal">Sleep Rating</span>
                <span className="font-normal text-muted-foreground">No logs today</span>
              </div>
              <div>
                <span className="opacity-80 block uppercase tracking-wider text-[8px] font-normal">Stress level</span>
                <span className="font-normal text-muted-foreground">No logs today</span>
              </div>
            </div>
          </div>
        </div>
      </m.div>
    )
  }
  
  const score = Math.max(50, 100 - symptoms.length * 10)
  
  let stressText = "Low (Stable)"
  let stressColor = "text-green-500"
  if (symptoms.includes('mood-anxious') || symptoms.includes('mood-irritable')) {
    stressText = "High"
    stressColor = "text-rose-500"
  } else if (symptoms.includes('mood-sad')) {
    stressText = "Moderate"
    stressColor = "text-amber-500"
  }
  
  const sleepText = symptoms.includes('phys-fatigue') ? "75% Restless" : "96% Optimal"

  return (
    <m.div variants={itemVariants} className="flo-card flo-card--prominent overflow-hidden group h-full">
      <div className="flex flex-col h-full">
        <div className="-mx-6 -mt-6 mb-4 h-[100px] relative shrink-0 overflow-hidden bg-card">
          <img src="/images/heart.png" alt="Wellness" className="w-full h-full object-cover" />
        </div>
        <div className="flo-card-top relative z-10">
          <div className="flo-card-icon flo-card-icon--pink flex items-center justify-center">
            <img src="/images/heart.png" alt="" className="size-5 object-contain" />
          </div>
        </div>
        <div className="mt-2 relative z-10 flex flex-col flex-1">
          <div className="flex-1">
            <p className="flo-card-title">Wellness Score</p>
            <div className="flex items-end gap-1">
              <h3 className="flo-card-desc text-2xl font-normal text-[var(--mf-accent)]">{score}</h3>
              <span className="text-xs mb-1.5 font-normal text-[var(--mf-accent)] opacity-60">/100</span>
            </div>
            <div className="w-full h-1.5 bg-[var(--mf-border)] rounded-full mt-3 overflow-hidden">
              <m.div 
                className="h-full bg-[var(--mf-accent)] rounded-full" 
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[var(--mf-border)] relative z-10 grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <span className="opacity-80 block uppercase tracking-wider text-[8px] font-normal">Sleep Rating</span>
              <span className="font-normal text-[var(--mf-text-strong)]">{sleepText}</span>
            </div>
            <div>
              <span className="opacity-80 block uppercase tracking-wider text-[8px] font-normal">Stress level</span>
              <span className={`font-normal ${stressColor}`}>{stressText}</span>
            </div>
          </div>
        </div>
      </div>
    </m.div>
  )
}

export function PartnerTranslationCard({ label, onCopy }: { 
  label: string; 
  onCopy: (text: string, title: string) => void; 
}) {
  const { desc, tips, gestures } = getPartnerTranslation(label)
  return (
    <m.div 
      variants={itemVariants}
      className="flo-card flo-card--prominent overflow-hidden h-full flex flex-col border-[var(--mf-border-strong)] bg-white dark:bg-[var(--mf-card)] partner-translation-card"
    >
      <div className="flo-card-top relative z-10 mb-2">
        <div className="flex flex-col gap-0.5">
          <p className="flo-card-title !text-[10px] !text-[var(--mf-accent)] font-normal tracking-[0.15em]">Partner</p>
          <h3 className="text-xl font-normal text-[var(--mf-text-strong)] capitalize">{label}</h3>
        </div>
        <div className="flo-card-icon text-[var(--mf-accent)]">
          <Users size={24} weight="fill" />
        </div>
      </div>
      
      <div className="mt-2 relative z-10 flex flex-col flex-1">
        <div className="p-4 rounded-2xl bg-[var(--mf-accent-soft)]/30 border border-[var(--mf-accent-soft)] mb-4">
          <p className="text-[0.95rem] text-[var(--mf-text-strong)] leading-relaxed font-normal">
            {desc}
          </p>
        </div>

        <div className="mt-2 pt-3 border-t border-[var(--mf-border)]">
          <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-wider block mb-2">How you can support</span>
          <ul className="text-sm space-y-2 text-[var(--mf-text-strong)]">
            {tips.map((tip) => (
              <li key={tip} className="flex items-start gap-2">
                <Check size={16} className="text-[var(--mf-accent)] shrink-0 mt-0.5" weight="bold" /> 
                <span className="leading-snug opacity-90">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto pt-4 border-t border-[var(--mf-border)] no-print">
          <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-wider block mb-2.5">Quick Supportive Gestures</span>
          <div className="flex flex-wrap gap-2">
            {gestures.map((g) => (
              <button
                key={g.title}
                type="button"
                onClick={() => onCopy(g.text, g.title)}
                className="px-3.5 py-2 rounded-xl bg-[var(--mf-card)] text-xs font-normal text-[var(--mf-text-strong)] border border-[var(--mf-border-strong)] hover:border-[var(--mf-accent-border)] transition-all flex items-center gap-1.5 "
              >
                {g.Icon === Heart ? (
                  <img src="/images/heart.png" alt="" className="size-3.5 object-contain" />
                ) : (
                  <g.Icon size={14} className={cn(g.color)} weight="bold" />
                )}
                <span>{g.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </m.div>
  )
}

export function QuickLogCard({ onViewAll }: { onViewAll: () => void }) {
  return (
    <m.div variants={itemVariants} className="flo-card flo-card--prominent h-full quick-log-card">
      <div className="flo-card-top mb-6">
        <p className="flo-card-title">Quick Log</p>
        <button type="button" 
          className="text-[var(--mf-accent)] text-xs font-normal flex items-center gap-1 hover:opacity-80 transition-opacity"
          onClick={onViewAll}
        >
          View all <CaretRight size={12} />
        </button>
      </div>

      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Mood', img: '/images/happy.jpg' },
            { label: 'Sleep', img: '/images/sleep_3d.png?v=1' },
            { label: 'Cravings', img: '/images/cravings.png' },
            { label: 'More', icon: <Plus size={20} weight="bold" /> },
          ].map(action => (
            <button type="button" 
              key={action.label} 
              className="flex flex-col items-center gap-2 transition-all group outline-none"
              onClick={onViewAll}
            >
              <div className="size-12 flex items-center justify-center rounded-full bg-[var(--mf-card)] border border-[var(--mf-border)] overflow-hidden transition-all group-hover:border-[var(--mf-accent)]">
                {action.img ? (
                  <img src={action.img} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-[var(--mf-muted)] group-hover:text-[var(--mf-accent)] transition-colors">
                    {action.icon}
                  </div>
                )}
              </div>
              <span className="text-[0.65rem] font-normal text-[var(--mf-muted)] group-hover:text-[var(--mf-text-strong)] transition-colors">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </m.div>
  )
}

function getPartnerTranslation(phaseLabel: string) {
  const normalizedPhase = phaseLabel.toLowerCase()
  switch(normalizedPhase) {
    case 'menstrual':
      return {
        desc: "Their body is resetting. Energy may be low, and they might experience cramps or discomfort.",
        tips: ["Offer a warm heating pad", "Take over extra chores to allow them to rest", "Be patient with mood fluctuations"],
        gestures: [
          { title: "Comfort note", text: "Hey! I'm thinking of you. Can I bring you some tea or chocolate to help you feel better?", Icon: Heart, color: "text-rose-500" },
          { title: "Offer heating pad", text: "Hey, let me know if you want me to heat up the pad or run an errand for you today! ", Icon: Coffee, color: "text-amber-600" },
          { title: "Soup recipe", text: "I'm thinking of making a warm, cozy soup for dinner tonight. Rest up, I've got it handled!", Icon: CookingPot, color: "text-orange-500" }
        ]
      }
    case 'follicular':
      return {
        desc: "Energy is rising. Great for new ideas.",
        tips: ["Suggest a fun date or activity", "Encourage their new ideas", "Enjoy their increased energy levels"],
        gestures: [
          { title: "Invite to walk", text: "The weather is nice today! Let's go for a walk or outdoor run after work? ‍♀️", Icon: Sun, color: "text-amber-500" },
          { title: "Plan weekend date", text: "Since your energy is up, let's plan a fun date night or weekend outing! Any places you've been wanting to try? ", Icon: Calendar, color: "text-teal-500" },
          { title: "Encourage ideas", text: "Hey, let's look into that new creative idea you mentioned. I'd love to help you design it!", Icon: Lightbulb, color: "text-yellow-500" }
        ]
      }
    case 'fertile':
      return {
        desc: "Hormones are peaking. They are likely feeling their most confident and energetic.",
        tips: ["Compliment them, they are feeling confident", "Great time for social events", "Communicate openly about intimacy"],
        gestures: [
          { title: "Date night dinner", text: "You are absolutely glowing lately. Let me take you out to a nice dinner tonight! ️", Icon: Martini, color: "text-indigo-500" },
          { title: "Sweet message", text: "Just wanted to say I love you and I'm so lucky to have you. Hope you have a wonderful day!", Icon: Heart, color: "text-rose-500" },
          { title: "Bring flowers", text: "I'm stopping by the store on my way home, bringing something nice for you!", Icon: Flower, color: "text-pink-500" }
        ]
      }
    case 'luteal':
    default:
      return {
        desc: "Progesterone is rising. Their body temperature is slightly higher, and they may experience lower energy levels and heightened cravings.",
        tips: ["Keep the bedroom cool tonight", "Offer a magnesium-rich snack", "Give them space to unwind and relax"],
        gestures: [
          { title: "Cozy night in", text: "Let's just stay in tonight, order some takeout and watch a movie. You deserve to relax! ", Icon: Popcorn, color: "text-amber-600" },
          { title: "Take over dinner", text: "Don't worry about any chores or dinner tonight, I'll take care of all of it. Just put your feet up!", Icon: CookingPot, color: "text-orange-500" },
          { title: "Ask how to help", text: "I know this phase can be a bit overwhelming. Let me know how I can make your day easier!", Icon: Question, color: "text-teal-500" }
        ]
      }
  }
}

export function ConnectionChecklistCard() {
  const { dashboard: ownDashboard, partnerStatus, user, completedActions, toggleSupportAction } = useStore()

  const data = user?.role === 'partner' && partnerStatus?.paired && partnerStatus?.cycle
    ? partnerStatus.cycle
    : ownDashboard

  const phaseLabel = data?.phaseLabel || 'Menstrual Phase'
  const tasks = getPhaseTasks(phaseLabel)
  const completedCount = tasks.filter(t => completedActions.includes(t.id)).length
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

  const handleToggle = (id: string, label: string) => {
    const wasCompleted = completedActions.includes(id)
    toggleSupportAction(id)
    if (!wasCompleted) {
      toast.success(`Completed: "${label}"!`, {
        icon: <img src="/images/heart.png" alt="" className="size-4.5 object-contain" />,
        duration: 3000
      })
    }
  }

  return (
    <div className="flo-card flo-card--prominent overflow-hidden h-full flex flex-col bg-[var(--mf-card)] connection-checklist-card">
      <div className="flo-card-top relative z-10">
        <p className="flo-card-title">Daily Connection</p>
        <div className="flo-card-icon text-teal-500 flex items-center justify-center">
          <img src="/images/heart.png" alt="" className="size-5 object-contain" />
        </div>
      </div>
      <div className="mt-2 relative z-10 flex flex-col flex-1">
        <p className="text-[0.85rem] text-[var(--mf-muted)] mb-4">
          Small gestures build lasting resonance. Try to complete these today:
        </p>
        
        <div className="space-y-3">
          {tasks.map((item) => {
            const isChecked = completedActions.includes(item.id)
            return (
              <button 
                key={item.id} 
                type="button"
                onClick={() => handleToggle(item.id, item.label)}
                className="w-full text-left flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 border border-border/20 transition-all hover:bg-muted/50 focus:outline-none"
              >
                <div className={cn(
                  "size-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                  isChecked ? "bg-teal-500 border-teal-500 text-white" : "border-muted-foreground/30"
                )}>
                  {isChecked && <Check size={12} weight="bold" />}
                </div>
                <span className={cn(
                  "text-[13px] transition-all leading-snug",
                  isChecked ? "text-[var(--mf-text-strong)] opacity-60 line-through" : "text-[var(--mf-text-strong)]"
                )}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-auto pt-4 flex items-center justify-between text-[10px] text-muted-foreground border-t border-[var(--mf-border)]">
          <span>Relationship resonance</span>
          <span className="text-teal-500 font-normal">{progressPercent}% Optimal</span>
        </div>
      </div>
    </div>
  )
}

import { useState } from "react"
import { motion } from "framer-motion"
import type { Variants } from "framer-motion"
import { Sparkle, Target, Heartbeat, Plus, Check, CaretRight, Users, Popcorn, CookingPot, Question, Coffee, Sun, Calendar, Lightbulb, Martini, Heart, Flower } from "@phosphor-icons/react"
import { SymptomLogger } from "./DailyCheckIn"
import { toast } from "sonner"
import { DailyTipCard } from "./DailyTipCard"
import { HormoneInsightCard } from "./HormoneInsightCard"
import { cn } from "../../lib/utils"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    }
  }
}

interface FeedSectionData {
  lastPeriodStart: string
  typicalCycleDays: number
  phaseLabel: string
  hormoneTrend: string
  bodySignals: string
  guidanceLines: string[]
}

interface FeedSectionProps {
  data: FeedSectionData
  computeCycleDay: (start: string, len: number) => number
  dispatch: React.Dispatch<{ type: string; payload?: boolean | undefined }>
  state: { isEditingGuidance: boolean }
  guidanceText: string
  update: (data: Partial<FeedSectionData>) => Promise<void>
}

const CYCLE_DAILY_TIPS = [
  "Rest and hydrate. Your body is resetting today.",
  "Keep workouts light. Walking or stretching is ideal.",
  "Energy is still low. Focus on nutrient-dense warm meals.",
  "You might start feeling a slight energy lift. Ease into activity.",
  "Your focus is improving. Great day for planning ahead.",
  "Energy is rising! Add a bit more intensity to your workout.",
  "Confidence is building. Tackle tasks you've been putting off.",
  "Social energy is high. Connect with friends or colleagues.",
  "Peak brain power today. Focus on complex problem solving.",
  "Your stamina is strong. Try a high-intensity (HIIT) session.",
  "Testosterone and estrogen are peaking. You're feeling your best.",
  "Great day for strength training and pushing your limits.",
  "Communication skills are at their peak. Have important conversations.",
  "Metabolism naturally increases. Listen to your hunger cues.",
  "Energy might start to plateau. Maintain steady habits.",
  "You might feel a slight dip. Prioritize complex carbohydrates.",
  "Focus on steady-state cardio rather than max-effort lifting.",
  "Emotions might feel closer to the surface. Practice mindfulness.",
  "Your body needs more recovery time after workouts.",
  "Cravings might spike. Opt for magnesium-rich dark chocolate.",
  "Energy is turning inward. Great day for solo, focused work.",
  "Water retention might occur. Drink plenty of fluids.",
  "Keep your evening schedule light to prioritize sleep.",
  "Your core temperature is higher. Keep your sleeping room cool.",
  "Avoid excessive caffeine as it might heighten stress.",
  "Focus on active recovery like yoga or light mobility work.",
  "Listen to your body. If you're tired, it's okay to rest.",
  "Prepare for tomorrow. Keep your routine simple and grounding."
]

export function FeedSection({
  data,
  computeCycleDay,
  dispatch,
}: FeedSectionProps) {
  const currentDay = computeCycleDay(data.lastPeriodStart, data.typicalCycleDays)
  const tipOfTheDay = CYCLE_DAILY_TIPS[(currentDay - 1) % CYCLE_DAILY_TIPS.length]
  const [tipCompleted, setTipCompleted] = useState(false)

  const partnerTranslation = (() => {
    switch(data.phaseLabel) {
      case 'Menstrual':
        return {
          desc: "Their body is resetting. Energy may be low, and they might experience cramps or discomfort.",
          tips: ["Offer a warm heating pad", "Take over extra chores to allow them to rest", "Be patient with mood fluctuations"],
          gestures: [
            { title: "Comfort note", text: "Hey! I'm thinking of you. Can I bring you some tea or chocolate to help you feel better? ❤️", Icon: Heart, color: "text-rose-500" },
            { title: "Offer heating pad", text: "Hey, let me know if you want me to heat up the pad or run an errand for you today! 🍵", Icon: Coffee, color: "text-amber-600" },
            { title: "Soup recipe", text: "I'm thinking of making a warm, cozy soup for dinner tonight. Rest up, I've got it handled!", Icon: CookingPot, color: "text-orange-500" }
          ]
        }
      case 'Follicular':
        return {
          desc: "Estrogen is rising. They may feel more energetic, creative, and social.",
          tips: ["Suggest a fun date or activity", "Encourage their new ideas", "Enjoy their increased energy levels"],
          gestures: [
            { title: "Invite to walk", text: "The weather is nice today! Let's go for a walk or outdoor run after work? 🏃‍♀️", Icon: Sun, color: "text-amber-500" },
            { title: "Plan weekend date", text: "Since your energy is up, let's plan a fun date night or weekend outing! Any places you've been wanting to try? 🌟", Icon: Calendar, color: "text-teal-500" },
            { title: "Encourage ideas", text: "Hey, let's look into that new creative idea you mentioned. I'd love to help you design it!", Icon: Lightbulb, color: "text-yellow-500" }
          ]
        }
      case 'Ovulation':
        return {
          desc: "Hormones are peaking. They are likely feeling their most confident and energetic.",
          tips: ["Compliment them, they are feeling confident", "Great time for social events", "Communicate openly about intimacy"],
          gestures: [
            { title: "Date night dinner", text: "You are absolutely glowing lately. Let me take you out to a nice dinner tonight! 🕯️", Icon: Martini, color: "text-indigo-500" },
            { title: "Sweet message", text: "Just wanted to say I love you and I'm so lucky to have you. Hope you have a wonderful day! ❤️", Icon: Heart, color: "text-rose-500" },
            { title: "Bring flowers", text: "I'm stopping by the store on my way home, bringing something nice for you!", Icon: Flower, color: "text-pink-500" }
          ]
        }
      case 'Luteal':
      default:
        return {
          desc: "Progesterone is rising. Their body temperature is slightly higher, and they may experience lower energy levels and heightened cravings.",
          tips: ["Keep the bedroom cool tonight", "Offer a magnesium-rich snack", "Give them space to unwind and relax"],
          gestures: [
            { title: "Cozy night in", text: "Let's just stay in tonight, order some takeout and watch a movie. You deserve to relax! 🍿", Icon: Popcorn, color: "text-amber-600" },
            { title: "Take over dinner", text: "Don't worry about any chores or dinner tonight, I'll take care of all of it. Just put your feet up!", Icon: CookingPot, color: "text-orange-500" },
            { title: "Ask how to help", text: "I know this phase can be a bit overwhelming. Let me know how I can make your day easier!", Icon: Question, color: "text-teal-500" }
          ]
        }
    }
  })()

  const handleCopyGesture = (text: string, title: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied supportive gesture!", {
      description: `"${title}" template copied to clipboard.`,
      duration: 3000
    })
  }

  return (
    <motion.section 
      className="flo-feed-section"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="flo-section-header" variants={itemVariants}>
        <div className="flex flex-col gap-1">
          <h2 className="flo-section-title">Today's plan</h2>
          <div className="flo-progress-track">
            <motion.div 
              className="flo-progress-fill" 
              initial={{ width: 0 }}
              animate={{ width: `${(currentDay / data.typicalCycleDays) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="text-[10px] uppercase tracking-widest font-normal bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] px-3 py-1.5 rounded-full transition-all"
            onClick={() => dispatch({ type: 'TOGGLE_SNAPSHOT', payload: true })}
          >
            Update Snapshot
          </motion.button>
          <button 
            className="flo-text-link"
            onClick={() => dispatch({ type: 'TOGGLE_CUSTOMIZE', payload: true })}
          >
            Customize <CaretRight size={12} />
          </button>
        </div>
      </motion.div>

      <div className="flo-feed-row flex items-stretch">
        {/* Primary Insight */}
        <motion.div variants={itemVariants} className="flo-card flo-card--prominent overflow-hidden group">
          <div className="flex flex-col h-full">
            <div className="-mx-6 -mt-6 mb-4 h-[100px] relative shrink-0 overflow-hidden">
              <motion.img 
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.6 }}
                src="/images/track.png" alt="Phase" className="w-full h-full object-cover object-center" 
              />
            </div>
            <div className="flo-card-top relative z-10">
              <div className="flex items-center gap-2">
                <div className="flo-card-icon flo-card-icon--accent">
                  <Sparkle size={20} weight="fill" />
                </div>
                <p className="flo-card-title !mb-0">{data.phaseLabel} Phase</p>
              </div>
              <span className="text-[10px] bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] px-2.5 py-1 rounded-full font-normal">DAY {currentDay}</span>
            </div>
            <div className="mt-2 relative z-10 flex flex-col flex-1">
              <div className="flex-1">
                <h3 className="flo-card-desc text-xl tracking-tight">{data.hormoneTrend}</h3>
                <p className="text-[0.85rem] text-[var(--mf-muted)] mt-2 leading-relaxed">
                  Progesterone is dominant, naturally increasing your metabolic rate. You might feel more hungry today.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[var(--mf-border)] flex items-center justify-between">
                <span className="text-xs font-normal opacity-60">PROGESTERONE PEAK</span>
                <div className="flex gap-2">
                  {['m1', 'm2', 'm3'].map(id => (
                    <motion.div 
                      key={id} 
                      whileHover={{ scale: 1.1 }}
                      className="size-6 rounded-full border border-[var(--mf-card)] bg-[var(--mf-accent-soft)]" 
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="flo-card flo-card--prominent overflow-hidden group">
          <div className="flex flex-col h-full">
            <div className="-mx-6 -mt-6 mb-4 h-[100px] relative shrink-0 overflow-hidden">
              <motion.img 
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.6 }}
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
                <h3 className="flo-card-desc text-lg">{data.bodySignals}</h3>
                <p className="text-xs opacity-50 mt-2">Common for Day {currentDay}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-[var(--mf-border)] relative z-10">
                <span className="text-[9px] font-normal text-muted-foreground uppercase tracking-wider block mb-1.5">Focus Areas</span>
                <div className="flex flex-wrap gap-1">
                  <span className="text-[10px] bg-[var(--mf-accent-soft)] px-2 py-0.5 rounded-md font-normal text-[var(--mf-accent)]">Hydrate Extra</span>
                  <span className="text-[10px] bg-muted px-2 py-0.5 rounded-md font-normal text-[var(--mf-text-strong)]">Light Stretch</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="flo-card flo-card--prominent overflow-hidden group">
          <div className="flex flex-col h-full">
            <div className="-mx-6 -mt-6 mb-4 h-[100px] relative shrink-0 overflow-hidden">
              <motion.img 
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.6 }}
                src="/images/heart.png" alt="Wellness" className="w-full h-full object-cover object-center scale-[1.3] translate-y-3" 
              />
            </div>
            <div className="flo-card-top relative z-10">
              <div className="flo-card-icon flo-card-icon--pink">
                <Heartbeat size={20} weight="fill" />
              </div>
            </div>
            <div className="mt-2 relative z-10 flex flex-col flex-1">
              <div className="flex-1">
                <p className="flo-card-title">Wellness Score</p>
                <div className="flex items-end gap-1">
                  <h3 className="flo-card-desc text-2xl font-normal text-[var(--mf-accent)]">84</h3>
                  <span className="text-xs mb-1.5 font-normal text-[var(--mf-accent)] opacity-60">/100</span>
                </div>
                <div className="w-full h-1.5 bg-[var(--mf-border)] rounded-full mt-3 overflow-hidden">
                  <motion.div 
                    className="h-full bg-[var(--mf-accent)] rounded-full" 
                    initial={{ width: 0 }}
                    animate={{ width: '84%' }}
                    transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[var(--mf-border)] relative z-10 grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="opacity-80 block uppercase tracking-wider text-[8px] font-normal">Sleep Rating</span>
                  <span className="font-normal text-[var(--mf-text-strong)]">92% Optimal</span>
                </div>
                <div>
                  <span className="opacity-80 block uppercase tracking-wider text-[8px] font-normal">Stress level</span>
                  <span className="font-normal text-green-500">Low (Stable)</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Guidance Card */}
        <DailyTipCard
          variants={itemVariants}
          tipCompleted={tipCompleted}
          setTipCompleted={setTipCompleted}
          tipOfTheDay={tipOfTheDay}
        />

        {/* Hormone Insight Card */}
        <HormoneInsightCard variants={itemVariants} />
      </div>

      {/* Partner Translate Card */}
      <motion.div 
        variants={itemVariants}
        className="flo-card flo-card--prominent overflow-hidden mt-8"
      >
        <div className="flo-card-top relative z-10">
          <p className="flo-card-title">Partner Translation</p>
          <div className="flo-card-icon text-[var(--mf-accent)]">
            <Users size={20} weight="fill" />
          </div>
        </div>
        <div className="mt-2 relative z-10 flex flex-col justify-between h-full">
          <p className="text-[0.95rem] text-[var(--mf-text)] opacity-90 leading-relaxed">
            What <span className="font-normal text-[var(--mf-accent)]">{data.phaseLabel} phase</span> means for your partner today: {partnerTranslation.desc}
          </p>
          <div className="mt-4 pt-3 border-t border-[var(--mf-border)]">
            <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-wider block mb-2">How you can support</span>
            <ul className="text-sm space-y-2 opacity-90">
              {partnerTranslation.tips.map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <Check size={16} className="text-[var(--mf-accent)] shrink-0 mt-0.5" weight="bold" /> 
                  <span className="leading-snug">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 pt-4 border-t border-[var(--mf-border)] no-print">
            <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-wider block mb-2.5">Quick Supportive Gestures</span>
            <div className="flex flex-wrap gap-2">
              {partnerTranslation.gestures.map((g) => (
                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: "var(--mf-hover)" }}
                  whileTap={{ scale: 0.98 }}
                  key={g.title}
                  type="button"
                  onClick={() => handleCopyGesture(g.text, g.title)}
                  className="px-3.5 py-2 rounded-xl bg-muted/40 text-xs font-normal text-[var(--mf-text-strong)] border border-border/50 hover:border-[var(--mf-accent-border)] transition-all flex items-center gap-1.5"
                >
                  <g.Icon size={14} className={cn(g.color)} weight="bold" />
                  <span>{g.title}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="flo-card flo-card--prominent mt-8">
        <div className="flo-card-top mb-6">
          <p className="flo-card-title">Quick Log</p>
          <button 
            className="text-[var(--mf-accent)] text-xs font-normal flex items-center gap-1 hover:opacity-80 transition-opacity" 
            onClick={() => dispatch({ type: 'TOGGLE_LOG', payload: true })}
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
              <motion.button 
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.95 }}
                key={action.label} 
                className="flex flex-col items-center gap-2 transition-all group outline-none"
                onClick={() => dispatch({ type: 'TOGGLE_LOG', payload: true })}
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
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Symptom Logger Card rendered natively in the right column */}
      <motion.div variants={itemVariants}>
        <SymptomLogger />
      </motion.div>
    </motion.section>
  )
}

import { useState } from "react"
import { Sparkle, Target, Heartbeat, Plus, Check, CaretRight, Users } from "@phosphor-icons/react"
import { SymptomLogger } from "./DailyCheckIn"

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
          tips: ["Offer a warm heating pad", "Take over extra chores to allow them to rest", "Be patient with mood fluctuations"]
        }
      case 'Follicular':
        return {
          desc: "Estrogen is rising. They may feel more energetic, creative, and social.",
          tips: ["Suggest a fun date or activity", "Encourage their new ideas", "Enjoy their increased energy levels"]
        }
      case 'Ovulation':
        return {
          desc: "Hormones are peaking. They are likely feeling their most confident and energetic.",
          tips: ["Compliment them, they are feeling confident", "Great time for social events", "Communicate openly about intimacy"]
        }
      case 'Luteal':
      default:
        return {
          desc: "Progesterone is rising. Their body temperature is slightly higher, and they may experience lower energy levels and heightened cravings.",
          tips: ["Keep the bedroom cool tonight", "Offer a magnesium-rich snack", "Give them space to unwind and relax"]
        }
    }
  })()

  return (
    <section className="flo-feed-section">
      <div className="flo-section-header">
        <div className="flex flex-col gap-1">
          <h2 className="flo-section-title">Today's plan</h2>
          <div className="flo-progress-track">
            <div className="flo-progress-fill" style={{ width: `${(currentDay / data.typicalCycleDays) * 100}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            className="text-[10px] uppercase tracking-widest font-medium bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] px-3 py-1.5 rounded-full transition-all active:scale-95"
            onClick={() => dispatch({ type: 'TOGGLE_SNAPSHOT', payload: true })}
          >
            Update Snapshot
          </button>
          <button 
            className="flo-text-link"
            onClick={() => dispatch({ type: 'TOGGLE_CUSTOMIZE', payload: true })}
          >
            Customize <CaretRight size={12} />
          </button>
        </div>
      </div>

      <div className="flo-feed-row flex items-stretch">
        {/* Primary Insight */}
        <div className="flo-card flo-card--prominent animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
          <div className="-mx-6 -mt-6 mb-4 h-[110px] relative shrink-0">
            <img src="/images/track.png" alt="Phase" className="w-full h-full object-cover object-center" />
          </div>
          <div className="flo-card-top relative z-10">
            <div className="flex items-center gap-2">
              <div className="flo-card-icon flo-card-icon--accent">
                <Sparkle size={20} weight="fill" />
              </div>
              <p className="flo-card-title !mb-0">{data.phaseLabel} Phase</p>
            </div>
            <span className="text-[10px] bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] px-2.5 py-1 rounded-full font-medium active-badge-glow">DAY {currentDay}</span>
          </div>
          <div className="flo-card-content mt-2 relative z-10 flex flex-col justify-between h-full">
            <div>
              <h3 className="flo-card-desc text-xl tracking-tight">{data.hormoneTrend}</h3>
              <p className="text-[0.85rem] text-[var(--mf-muted)] mt-2 leading-relaxed">
                Progesterone is dominant, naturally increasing your metabolic rate. You might feel more hungry today.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--mf-border)] flex items-center justify-between">
              <span className="text-xs font-medium opacity-60">PROGESTERONE PEAK</span>
              <div className="flex gap-2">
                {['m1', 'm2', 'm3'].map(id => <div key={id} className="size-6 rounded-full border-2 border-[var(--mf-card)] bg-[var(--mf-accent-soft)]" />)}
              </div>
            </div>
          </div>
        </div>

        <div className="flo-card flo-card--prominent overflow-hidden flex flex-col justify-between">
          <div>
            <div className="-mx-6 -mt-6 mb-4 h-[90px] relative shrink-0">
              <img src="/images/calm.jpg" alt="Body Signals" className="w-full h-full object-cover" />
            </div>
            <div className="flo-card-top relative z-10">
              <div className="flo-card-icon flo-card-icon--pink">
                <Target size={20} weight="fill" />
              </div>
            </div>
            <div className="flo-card-content mt-2 relative z-10">
              <p className="flo-card-title">Body Signals</p>
              <h3 className="flo-card-desc text-lg">{data.bodySignals}</h3>
              <p className="text-xs opacity-50 mt-2">Common for Day {currentDay}</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[var(--mf-border)] relative z-10">
            <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Focus Areas</span>
            <div className="flex flex-wrap gap-1">
              <span className="text-[10px] bg-[var(--mf-accent-soft)] px-2 py-0.5 rounded-md font-medium text-[var(--mf-accent)]">💧 Hydrate Extra</span>
              <span className="text-[10px] bg-muted px-2 py-0.5 rounded-md font-medium text-[var(--mf-text-strong)]">🧘‍♀️ Light Stretch</span>
            </div>
          </div>
        </div>

        <div className="flo-card flo-card--prominent overflow-hidden flex flex-col justify-between">
          <div>
            <div className="-mx-6 -mt-6 mb-4 h-[110px] relative shrink-0">
              <img src="/images/heart.png" alt="Wellness" className="w-full h-full object-cover object-center scale-[1.3] translate-y-3" />
            </div>
            <div className="flo-card-top relative z-10">
              <div className="flo-card-icon flo-card-icon--pink">
                <Heartbeat size={20} weight="fill" />
              </div>
            </div>
            <div className="flo-card-content mt-2 relative z-10">
              <p className="flo-card-title">Wellness Score</p>
              <div className="flex items-end gap-1">
                <h3 className="flo-card-desc text-2xl font-medium text-[var(--mf-accent)]">84</h3>
                <span className="text-xs mb-1.5 font-medium text-[var(--mf-accent)] opacity-60">/100</span>
              </div>
              <div className="w-full h-1.5 bg-[var(--mf-border)] rounded-full mt-3">
                <div className="h-full bg-[var(--mf-accent)] rounded-full" style={{ width: '84%' }} />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[var(--mf-border)] relative z-10 grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <span className="opacity-80 block uppercase tracking-wider text-[8px] font-medium">Sleep Rating</span>
              <span className="font-medium text-[var(--mf-text-strong)]">92% Optimal</span>
            </div>
            <div>
              <span className="opacity-80 block uppercase tracking-wider text-[8px] font-medium">Stress level</span>
              <span className="font-medium text-green-500">Low (Stable)</span>
            </div>
          </div>
        </div>

        {/* Guidance Card */}
        <div className="flo-card flo-card--featured animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="-mx-6 -mt-6 mb-4 h-[100px] relative shrink-0">
              <img src="/images/star.png" alt="Daily Tip" className="w-full h-full object-cover object-center scale-125" />
            </div>
            <div className="flo-card-top relative z-10">
              <div className="flex items-center gap-2">
                <div className="flo-card-icon flo-card-icon--pink">
                  <Plus size={20} weight="fill" />
                </div>
                <p className="flo-card-title !mb-0">Daily Tip</p>
              </div>
            </div>
            
            <div className="mt-2 relative z-10">
              <div className="flex flex-col gap-3">
                <ul className="flo-guidance-list">
                  <li className={`flo-guidance-item transition-all duration-300 ${tipCompleted ? 'opacity-65 line-through' : ''}`}>
                    <Check size={16} className={tipCompleted ? "text-green-500 shrink-0" : "text-[var(--mf-accent)] shrink-0"} weight="bold" />
                    <span className="text-[0.9rem] leading-snug">{tipOfTheDay}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <button 
            type="button"
            className="mt-4 pt-3 border-t border-[var(--mf-border)] relative z-10 w-full flex items-center justify-between text-[11px] font-medium text-[var(--mf-accent)] hover:opacity-85 transition-opacity"
            onClick={() => setTipCompleted(!tipCompleted)}
          >
            <span>{tipCompleted ? 'Tip Completed' : 'Mark tip as done'}</span>
            <div className={`size-5 rounded-full border flex items-center justify-center transition-colors ${tipCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-[var(--mf-accent)] text-transparent'}`}>
              <Check size={10} weight="bold" />
            </div>
          </button>
        </div>
        
        {/* Hormone Insight Card */}
        <div className="flo-card flo-card--dark animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 overflow-hidden">
          <div className="-mx-6 -mt-6 mb-4 h-[100px] relative shrink-0">
            <img src="/images/brain.png" alt="Insight" className="w-full h-full object-cover object-center scale-[1.3] translate-y-1" />
          </div>
          <div className="flo-card-top relative z-10">
            <p className="flo-card-title">Scientific Insight</p>
            <Sparkle size={16} className="text-[var(--mf-accent)]" weight="fill" />
          </div>
          <div className="mt-2 relative z-10 flex flex-col justify-between h-full">
            <p className="text-[0.95rem] text-[var(--mf-text)] opacity-90 leading-relaxed">
              Did you know? Progesterone can raise your resting heart rate by <span className="text-[var(--mf-accent)] font-medium">2-5 beats per minute</span> during this phase. Don't be alarmed if your tracker shows slightly higher exertion today.
            </p>
            <button className="text-[var(--mf-accent)] text-xs font-medium mt-6 flex items-center gap-1.5 hover:gap-2 transition-all">
              Read medical research <CaretRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Partner Translate Card */}
      <div className="flo-card flo-card--prominent animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400 overflow-hidden mt-8">
        <div className="flo-card-top relative z-10">
          <p className="flo-card-title">Partner Translation</p>
          <div className="flo-card-icon text-[var(--mf-accent)]">
            <Users size={20} weight="fill" />
          </div>
        </div>
        <div className="mt-2 relative z-10 flex flex-col justify-between h-full">
          <p className="text-[0.95rem] text-[var(--mf-text)] opacity-90 leading-relaxed">
            What <span className="font-medium text-[var(--mf-accent)]">{data.phaseLabel} phase</span> means for your partner today: {partnerTranslation.desc}
          </p>
          <div className="mt-4 pt-3 border-t border-[var(--mf-border)]">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-2">How you can support</span>
            <ul className="text-sm space-y-2 opacity-90">
              {partnerTranslation.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Check size={16} className="text-[var(--mf-accent)] shrink-0 mt-0.5" weight="bold" /> 
                  <span className="leading-snug">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="flo-card flo-card--prominent mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
        <div className="flo-card-top mb-6">
          <p className="flo-card-title">Quick Log</p>
          <button 
            className="text-[var(--mf-accent)] text-xs font-medium flex items-center gap-1 hover:opacity-80 transition-opacity" 
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
              <button 
                key={action.label} 
                className="flex flex-col items-center gap-2 transition-all group outline-none"
                onClick={() => dispatch({ type: 'TOGGLE_LOG', payload: true })}
              >
                <div className="size-12 flex items-center justify-center rounded-full bg-[var(--mf-card)] border border-[var(--mf-border)] overflow-hidden transition-transform group-hover:scale-110 group-hover:border-[var(--mf-accent)]">
                  {action.img ? (
                    <img src={action.img} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-[var(--mf-muted)] group-hover:text-[var(--mf-accent)] transition-colors">
                      {action.icon}
                    </div>
                  )}
                </div>
                <span className="text-[0.65rem] font-medium text-[var(--mf-muted)] group-hover:text-[var(--mf-text-strong)] transition-colors">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Symptom Logger Card rendered natively in the right column */}
      <SymptomLogger />
    </section>
  )
}

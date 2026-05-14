
import { Sparkle, Target, Heartbeat, Plus, Check, CaretRight } from "@phosphor-icons/react"

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
            className="text-[10px] uppercase tracking-widest font-medium bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] px-3 py-1.5 rounded-full hover:shadow-[0_2px_8px_rgba(var(--mf-accent-rgb),0.2)] transition-all active:scale-95"
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
        <div className="flo-card flo-card--prominent animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flo-card-top">
            <div className="flex items-center gap-2">
              <div className="flo-card-icon flo-card-icon--accent">
                <Sparkle size={20} weight="fill" />
              </div>
              <p className="flo-card-title !mb-0">{data.phaseLabel} Phase</p>
            </div>
            <span className="text-[10px] bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] px-2.5 py-1 rounded-full font-semibold active-badge-glow">DAY {currentDay}</span>
          </div>
          <div className="flo-card-content mt-2">
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


          <div className="flo-card flo-card--prominent">
            <div className="flo-card-top">
              <div className="flo-card-icon flo-card-icon--pink">
                <Target size={20} weight="fill" />
              </div>
            </div>
            <div className="flo-card-content mt-2">
              <p className="flo-card-title">Body Signals</p>
              <h3 className="flo-card-desc text-lg">{data.bodySignals}</h3>
              <p className="text-xs opacity-50 mt-2">Common for Day {currentDay}</p>
            </div>
          </div>

          <div className="flo-card flo-card--prominent">
            <div className="flo-card-top">
              <div className="flo-card-icon flo-card-icon--pink">
                <Heartbeat size={20} weight="fill" />
              </div>
            </div>
            <div className="flo-card-content mt-2">
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


        {/* Guidance Card */}
        <div className="flo-card flo-card--featured animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <div className="flo-card-top">
            <div className="flex items-center gap-2">
              <div className="flo-card-icon flo-card-icon--pink">
                <Plus size={20} weight="fill" />
              </div>
              <p className="flo-card-title !mb-0">Daily Tip</p>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex flex-col gap-3">
              <ul className="flo-guidance-list">
                <li className="flo-guidance-item">
                  <Check size={16} className="text-[var(--mf-accent)] shrink-0" weight="bold" />
                  <span className="text-[0.9rem] leading-snug">{tipOfTheDay}</span>
                </li>
              </ul>
            </div>
          </div>
          </div>
        
        {/* Hormone Insight Card */}
        <div className="flo-card flo-card--dark animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          <div className="flo-card-top">
            <p className="flo-card-title">Scientific Insight</p>
            <Sparkle size={16} className="text-[var(--mf-accent)]" weight="fill" />
          </div>
          <div className="mt-3">
            <p className="text-[0.95rem] text-[var(--mf-text)] opacity-90 leading-relaxed">
              Did you know? Progesterone can raise your resting heart rate by <span className="text-[var(--mf-accent)] font-semibold">2-5 beats per minute</span> during this phase. Don't be alarmed if your tracker shows slightly higher exertion today.
            </p>
          </div>
          <button className="text-[var(--mf-accent)] text-xs font-semibold mt-6 flex items-center gap-1.5 hover:gap-2 transition-all">
            Read medical research <CaretRight size={12} />
          </button>
        </div>
      </div>

      <div className="flo-card flo-card--prominent mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
        <div className="flo-card-top mb-6">
          <p className="flo-card-title">Quick Log</p>
          <button 
            className="text-[var(--mf-accent)] text-xs font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity" 
            onClick={() => dispatch({ type: 'TOGGLE_LOG', payload: true })}
          >
            View all <CaretRight size={12} />
          </button>
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <h3 className="text-xs font-semibold text-[var(--mf-muted)] uppercase tracking-wider mb-4 text-center">How's your flow?</h3>
            <div className="flex items-center justify-around">
              {[
                { label: 'None', id: 'none', icon: <Plus size={16} weight="bold" /> },
                { label: 'Light', id: 'light', img: '/images/flow_light.png' },
                { label: 'Medium', id: 'medium', img: '/images/flow_medium.png' },
                { label: 'Heavy', id: 'heavy', img: '/images/flow_heavy.png' },
              ].map(item => (
                <button 
                  key={item.id} 
                  className="flex flex-col items-center gap-2 transition-all group outline-none"
                  onClick={() => dispatch({ type: 'TOGGLE_LOG', payload: true })}
                >
                  <div className="size-12 flex items-center justify-center rounded-full bg-[var(--mf-card)] border border-[var(--mf-border)] overflow-hidden transition-transform group-hover:scale-110 group-hover:border-[var(--mf-accent)]">
                    {item.img ? (
                      <img src={item.img} alt="" className="w-full h-full object-cover mix-blend-multiply" />
                    ) : (
                      <div className="text-[var(--mf-muted)] group-hover:text-[var(--mf-accent)] transition-colors">
                        {item.icon}
                      </div>
                    )}
                  </div>
                  <span className="text-[0.65rem] font-medium text-[var(--mf-muted)] group-hover:text-[var(--mf-text-strong)] transition-colors">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Mood', img: '/images/happy.jpg' },
              { label: 'Weight', img: '/images/weight.png' },
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


    </section>
  )
}

import { m } from "framer-motion"
import type { Variants } from "framer-motion"
import { Check, Plus } from "@phosphor-icons/react"

interface DailyTipCardProps {
  phaseLabel: string
  tipCompleted: boolean
  setTipCompleted: (completed: boolean) => void
  variants?: Variants
  aiTip?: { title: string; desc: string }
}

const TIPS_BY_PHASE: Record<string, { title: string; desc: string }> = {
  menstrual: {
    title: "Prioritize warm comfort",
    desc: "Focus on iron-rich warm meals like soups and teas. Encourage rest and light walking to ease uterine cramps."
  },
  follicular: {
    title: "Embrace rising energy",
    desc: "Suggest starting a new creative project or outdoor activity together. Her body is highly responsive to learning and planning."
  },
  ovulatory: {
    title: "Match peak connection",
    desc: "Plan a fun date night or social gathering. Estrogen is at its peak, boosting confidence, communication, and libido."
  },
  fertile: {
    title: "Match peak connection",
    desc: "Plan a fun date night or social gathering. Estrogen is at its peak, boosting confidence, communication, and libido."
  },
  luteal: {
    title: "Nurture her energy",
    desc: "Water retention might occur. Support her with cool environments, magnesium-rich snacks, and quiet nesting time."
  }
}

export function DailyTipCard({ phaseLabel, tipCompleted, setTipCompleted, variants, aiTip }: DailyTipCardProps) {
  const normalized = (phaseLabel || '').toLowerCase()
  const staticTip = normalized
    ? (TIPS_BY_PHASE[normalized] || TIPS_BY_PHASE.luteal)
    : {
        title: "Setup Cycle Tracking",
        desc: "Please enter your partner's last period date in Settings or Tracker to compute cycle phases and receive tailored daily recommendations."
      }
  const tip = aiTip || staticTip

  return (
    <m.div 
      variants={variants}
      className="flo-card flo-card--featured overflow-hidden flex flex-col group relative !p-5 md:!p-6 xl:!p-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4 md:gap-5 xl:gap-8 ">
        <div className="shrink-0 size-10 md:size-12 flex items-center justify-center">
          <img src="/images/star.png" alt="" className="size-6 md:size-7 object-contain" />
        </div>

        <div className="flex-1 flex flex-col min-w-0 md:pl-4 xl:pl-6">
          <div className="relative z-10 mb-3 xl:mb-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-500">
                  <Plus size={14} weight="bold" />
                </div>
                <span className="text-[10px] md:text-[11px] font-medium text-pink-500 uppercase tracking-[0.2em]">Daily Tip</span>
              </div>
              <span className="text-[9px] md:text-[10px] font-normal text-[var(--mf-muted)] uppercase tracking-[0.15em] ml-8">Phase: {phaseLabel}</span>
            </div>
          </div>
          
          <div className="relative z-10 ml-8 min-w-0">
            <h3 className="text-xl md:text-xl xl:text-2xl font-normal text-[var(--mf-text-strong)] tracking-tight mb-2 whitespace-nowrap">{tip.title}</h3>
            <p className="text-[12px] md:text-[13px] xl:text-[15px] leading-relaxed text-[var(--mf-text)] opacity-80 max-w-2xl font-normal">
              {tip.desc}
            </p>
          </div>
        </div>

        <div className="md:border-l border-[var(--mf-border)]/50 md:pl-6 xl:pl-10 flex flex-col gap-3 shrink-0 min-w-[150px] xl:min-w-[180px]">
          <div className="flex flex-col gap-2">
            <m.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full px-4 xl:px-6 py-2 xl:py-2.5 rounded-full bg-[var(--mf-accent)] text-white text-[9px] xl:text-[10px] font-medium tracking-widest uppercase"
            >
              Learn More
            </m.button>
            
            <m.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full px-4 xl:px-6 py-2 xl:py-2.5 rounded-full border border-[var(--mf-border)] bg-[var(--mf-card)] text-[var(--mf-text-strong)] text-[9px] xl:text-[10px] font-medium tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-[var(--mf-hover)] transition-all"
            >
              <img src="/images/heart.png" alt="" className="size-3.5 object-contain" />
              <span>Save</span>
            </m.button>
          </div>
          
          <m.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            className="flex items-center justify-between gap-2 xl:gap-4 text-[10px] xl:text-[11px] font-normal text-[var(--mf-accent)] transition-all hover:opacity-80 mt-1"
            onClick={() => setTipCompleted(!tipCompleted)}
          >
            <span className="font-medium tracking-wide">{tipCompleted ? 'Tip Completed' : 'Mark as done'}</span>
            <m.div 
              animate={tipCompleted ? { scale: [1, 1.2, 1], backgroundColor: "#22c55e", borderColor: "#22c55e" } : { scale: 1 }}
              className={`size-5 xl:size-6 rounded-full border flex items-center justify-center transition-colors ${tipCompleted ? 'text-white' : 'border-[var(--mf-accent)] text-transparent'}`}
            >
              <Check size={12} weight="bold" />
            </m.div>
          </m.button>
        </div>
      </div>
    </m.div>
  )
}

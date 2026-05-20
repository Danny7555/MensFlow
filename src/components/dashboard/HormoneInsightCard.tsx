import { Sparkle, CaretRight } from "@phosphor-icons/react"

export function HormoneInsightCard() {
  return (
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
          Did you know? Progesterone can raise your resting heart rate by <span className="text-[var(--mf-accent)] font-normal">2-5 beats per minute</span> during this phase. Don't be alarmed if your tracker shows slightly higher exertion today.
        </p>
        <button className="text-[var(--mf-accent)] text-xs font-normal mt-6 flex items-center gap-1.5 hover:gap-2 transition-all">
          Read medical research <CaretRight size={12} />
        </button>
      </div>
    </div>
  )
}

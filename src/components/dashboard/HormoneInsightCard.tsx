import { motion } from "framer-motion"
import type { Variants } from "framer-motion"
import { Sparkle, CaretRight } from "@phosphor-icons/react"

interface HormoneInsightCardProps {
  variants?: Variants
}

export function HormoneInsightCard({ variants }: HormoneInsightCardProps) {
  return (
    <motion.div 
      variants={variants}
      className="flo-card flo-card--dark overflow-hidden flex flex-col group"
    >
      <div className="flex-1">
        <div className="-mx-6 -mt-6 mb-4 h-[100px] relative shrink-0 overflow-hidden">
          <motion.img 
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.6 }}
            src="/images/brain.png" alt="Insight" className="w-full h-full object-cover object-center scale-[1.3] translate-y-1" 
          />
        </div>
        <div className="flo-card-top relative z-10">
          <p className="flo-card-title">Scientific Insight</p>
          <Sparkle size={16} className="text-[var(--mf-accent)]" weight="fill" />
        </div>
        <div className="mt-2 relative z-10">
          <p className="text-[0.95rem] text-[var(--mf-text)] opacity-90 leading-relaxed">
            Did you know? Progesterone can raise your resting heart rate by <span className="text-[var(--mf-accent)] font-normal">2-5 beats per minute</span> during this phase. Don't be alarmed if your tracker shows slightly higher exertion today.
          </p>
        </div>
      </div>
      
      <button className="text-[var(--mf-accent)] text-xs font-normal mt-6 pt-4 border-t border-[var(--mf-border)] flex items-center justify-between hover:gap-2 transition-all w-full">
        <span>Read medical research</span>
        <CaretRight size={12} />
      </button>
    </motion.div>
  )
}

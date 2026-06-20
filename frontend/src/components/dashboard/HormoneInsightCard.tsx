import { useState } from "react"
import { m } from "framer-motion"
import type { Variants } from "framer-motion"
import { CaretRight, Brain } from "@phosphor-icons/react"
import { useNavigate } from "react-router-dom"

interface HormoneInsightCardProps {
  variants?: Variants
  phaseLabel?: string
  aiInsightText?: string
}

const INSIGHTS_BY_PHASE: Record<string, string> = {
  menstrual: "Did you know? Estrogen and progesterone drop to their lowest levels. This triggers the shedding of the uterine lining, naturally lowering your body temperature and resting heart rate.",
  follicular: "Did you know? Estrogen levels rise, which stimulates the growth of follicles in your ovaries and can increase your cognitive clarity, mood, and physical stamina.",
  ovulatory: "Did you know? Luteinizing hormone peaks, triggering ovulation. This is typically when your physical energy, libido, and communication skills are at their highest.",
  fertile: "Did you know? Estrogen peaks to help prepare for potential fertilization. You might notice higher energy and increased social motivation during this time.",
  luteal: "Did you know? Progesterone rises, raising your resting heart rate by 2-5 beats per minute and slightly increasing basal body temperature. Don't be alarmed if your tracker shows higher exertion today."
}

export function HormoneInsightCard({ variants, phaseLabel, aiInsightText }: HormoneInsightCardProps) {
  const navigate = useNavigate()
  const [imgError, setImgError] = useState(false)
  const normalized = (phaseLabel || '').toLowerCase()
  const staticInsight = normalized 
    ? (INSIGHTS_BY_PHASE[normalized] || INSIGHTS_BY_PHASE.luteal)
    : INSIGHTS_BY_PHASE.luteal
  const insightText = aiInsightText || staticInsight

  return (
    <m.div 
      variants={variants}
      className="flo-card flo-card--dark overflow-hidden flex flex-col group"
    >
      <div className="flex-1">
        <div className="-mx-6 -mt-6 mb-4 h-[100px] relative shrink-0 overflow-hidden bg-gradient-to-br from-purple-500/20 to-indigo-500/10">
          {!imgError && (
            <m.img 
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.6 }}
              src="/images/brain.jpg" alt="Insight"
              className="w-full h-full object-cover object-center scale-[1.3] translate-y-1 opacity-80"
              onError={() => setImgError(true)}
            />
          )}
          {imgError && (
            <div className="w-full h-full flex items-center justify-center">
              <Brain size={32} className="text-[var(--mf-accent)] opacity-40" weight="light" />
            </div>
          )}
        </div>
        <div className="flo-card-top relative z-10">
          <p className="flo-card-title">Scientific Insight</p>
          <Brain size={16} className="text-[var(--mf-accent)]" weight="fill" />
        </div>
        <div className="mt-2 relative z-10 bg-gradient-to-b from-transparent via-transparent to-transparent">
          <p className="text-[0.95rem] text-[var(--mf-text)] leading-relaxed font-normal">
            {insightText}
          </p>
        </div>
      </div>
      
      <button
        type="button"
        onClick={() => navigate('/education')}
        className="text-[var(--mf-accent)] text-xs font-normal mt-6 pt-4 border-t border-[var(--mf-border)] flex items-center justify-between hover:gap-3 transition-all w-full group cursor-pointer"
      >
        <span className="group-hover:translate-x-0.5 transition-transform">Read medical research</span>
        <CaretRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
      </button>
    </m.div>
  )
}

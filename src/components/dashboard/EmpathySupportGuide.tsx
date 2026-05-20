import { Sparkle } from '@phosphor-icons/react'

interface EmpathySupportGuideProps {
  supportTip: string
}

export function EmpathySupportGuide({ supportTip }: EmpathySupportGuideProps) {
  return (
    <div className="border-t md:border-t-0 md:border-l border-[var(--mf-border)]/50 pt-4 md:pt-0 md:pl-6 flex flex-col">
      <h4 className="text-xs font-normal text-[var(--mf-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Sparkle size={14} className="text-amber-500" />
        Empathy Support Guide
      </h4>
      <p className="text-[11.5px] text-[var(--mf-text)] leading-relaxed font-normal bg-[var(--mf-hover)]/30 p-3.5 rounded-2xl border border-[var(--mf-border)]/40 flex-grow">
        {supportTip}
      </p>
    </div>
  )
}

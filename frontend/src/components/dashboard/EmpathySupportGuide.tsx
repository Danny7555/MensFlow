import { Sparkle } from '@phosphor-icons/react'

interface EmpathySupportGuideProps {
  supportTip: string
}

export function EmpathySupportGuide({ supportTip }: EmpathySupportGuideProps) {
  return (
    <div className="border-t md:border-t-0 md:border-l border-[var(--mf-border)]/50 pt-4 md:pt-0 md:pl-5 flex flex-col h-full">
      <h4 className="text-[9px] md:text-[10px] font-medium text-[var(--mf-muted)] uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
        <div className="size-4 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-500">
          <Sparkle size={10} weight="bold" />
        </div>
        Empathy Support Guide
      </h4>
      
      <div className="relative group">
        <div className="relative bg-[var(--mf-card)]/40 border border-[var(--mf-border)]/50 p-2.5 md:p-3 rounded-[12px] flex flex-col transition-all duration-300">
          <div className="flex items-start gap-2.5 md:gap-3">
            <div className="shrink-0 mt-0.5">
              <div className="size-6 md:size-6.5 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <img src="/images/heart.png" alt="" className="size-3.5 object-contain" />
              </div>
            </div>
            
            <div className="space-y-1">
              <span className="text-[8.5px] md:text-[9px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">Recommended Action:</span>
              <p className="text-[10px] md:text-[10.5px] text-[var(--mf-text-strong)] leading-relaxed font-normal">
                {supportTip}
              </p>
            </div>
          </div>
          
          <div className="mt-3 md:mt-4 pt-2.5 md:pt-3 border-t border-[var(--mf-border)]/30 flex items-center gap-2">
            <div className="flex">
              {['happy', 'calm', 'mens'].map((img, idx) => (
                <div key={img} className={`size-3.5 md:size-4 rounded-full border border-[var(--mf-card)] bg-[var(--mf-border)] overflow-hidden ${idx > 0 ? '-ml-1' : ''}`}>
                  <img src={`/images/${img}.jpg`} alt="" className="size-full object-cover" />
                </div>
              ))}
            </div>
            <span className="text-[8px] md:text-[8.5px] text-[var(--mf-muted)] font-normal">Trusted by partners</span>
          </div>
        </div>
      </div>
    </div>
  )
}

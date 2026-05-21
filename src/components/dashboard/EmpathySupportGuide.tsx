import { Sparkle, Heart } from '@phosphor-icons/react'

interface EmpathySupportGuideProps {
  supportTip: string
}

export function EmpathySupportGuide({ supportTip }: EmpathySupportGuideProps) {
  return (
    <div className="border-t md:border-t-0 md:border-l border-[var(--mf-border)]/50 pt-6 md:pt-0 md:pl-6 flex flex-col">
      <h4 className="text-[10px] font-medium text-[var(--mf-muted)] uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
        <div className="size-5 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
          <Sparkle size={12} weight="bold" />
        </div>
        Empathy Support Guide
      </h4>
      
      <div className="relative group flex-grow">
        <div className="relative bg-[var(--mf-card)]/60 border border-[var(--mf-border)]/60 p-5 rounded-[20px] flex flex-col h-full transition-all duration-300">
          <div className="flex items-start gap-3.5">
            <div className="shrink-0 mt-1">
              <div className="size-8 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Heart size={16} weight="fill" />
              </div>
            </div>
            
            <div className="space-y-2">
              <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">Recommended Action:</span>
              <p className="text-[11.5px] text-[var(--mf-text-strong)] leading-relaxed font-normal">
                {supportTip}
              </p>
            </div>
          </div>
          
          <div className="mt-auto pt-4 flex items-center gap-2">
            <div className="flex gap-x-1.5">
              {['happy', 'calm', 'mens'].map((img) => (
                <div key={img} className="size-5 rounded-full border border-[var(--mf-card)] bg-[var(--mf-border)] overflow-hidden">
                  <img src={`/images/${img}.jpg`} alt="" className="size-full object-cover" />
                </div>
              ))}
            </div>
            <span className="text-[9px] text-[var(--mf-muted)] font-normal">Trusted by partners</span>
          </div>
        </div>
      </div>
    </div>
  )
}

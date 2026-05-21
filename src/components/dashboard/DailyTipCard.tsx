import { m } from "framer-motion"
import type { Variants } from "framer-motion"
import { Check, Plus } from "@phosphor-icons/react"

interface DailyTipCardProps {
  tipCompleted: boolean
  setTipCompleted: (completed: boolean) => void
  tipOfTheDay: string
  variants?: Variants
}

export function DailyTipCard({ tipCompleted, setTipCompleted, tipOfTheDay, variants }: DailyTipCardProps) {
  return (
    <m.div 
      variants={variants}
      className="flo-card flo-card--featured overflow-hidden flex flex-col group"
    >
      <div className="flex-1">
        <div className="-mx-6 -mt-6 mb-4 h-[100px] relative shrink-0 overflow-hidden">
          <m.img 
            animate={{ 
              y: [0, -5, 0],
              scale: [1.25, 1.3, 1.25]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            src="/images/star.png" alt="Daily Tip" className="w-full h-full object-cover object-center" 
          />
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
              <m.li 
                animate={tipCompleted ? { opacity: 0.65, x: 5 } : { opacity: 1, x: 0 }}
                className={`flo-guidance-item flex items-start gap-2 transition-all duration-300 ${tipCompleted ? 'line-through' : ''}`}
              >
                <div className="mt-1">
                  {tipCompleted ? (
                    <m.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }}>
                      <Check size={16} className="text-green-500 shrink-0" weight="bold" />
                    </m.div>
                  ) : (
                    <Check size={16} className="text-[var(--mf-accent)] shrink-0" weight="bold" />
                  )}
                </div>
                <span className="text-[0.9rem] leading-snug">{tipOfTheDay}</span>
              </m.li>
            </ul>
          </div>
        </div>
      </div>

      <m.button 
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        type="button"
        className="mt-4 pt-3 border-t border-[var(--mf-border)] relative z-10 w-full flex items-center justify-between text-[11px] font-normal text-[var(--mf-accent)] transition-all"
        onClick={() => setTipCompleted(!tipCompleted)}
      >
        <span className="font-medium">{tipCompleted ? 'Tip Completed' : 'Mark tip as done'}</span>
        <m.div 
          animate={tipCompleted ? { scale: [1, 1.2, 1], backgroundColor: "#22c55e", borderColor: "#22c55e" } : { scale: 1 }}
          className={`size-6 rounded-full border flex items-center justify-center transition-colors ${tipCompleted ? 'text-white' : 'border-[var(--mf-accent)] text-transparent'}`}
        >
          <Check size={12} weight="bold" />
        </m.div>
      </m.button>
    </m.div>
  )
}

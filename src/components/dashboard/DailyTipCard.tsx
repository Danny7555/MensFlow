import { Check, Plus } from "@phosphor-icons/react"

interface DailyTipCardProps {
  tipCompleted: boolean
  setTipCompleted: (completed: boolean) => void
  tipOfTheDay: string
}

export function DailyTipCard({ tipCompleted, setTipCompleted, tipOfTheDay }: DailyTipCardProps) {
  return (
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
        className="mt-4 pt-3 border-t border-[var(--mf-border)] relative z-10 w-full flex items-center justify-between text-[11px] font-normal text-[var(--mf-accent)] hover:opacity-85 transition-opacity"
        onClick={() => setTipCompleted(!tipCompleted)}
      >
        <span>{tipCompleted ? 'Tip Completed' : 'Mark tip as done'}</span>
        <div className={`size-5 rounded-full border flex items-center justify-center transition-colors ${tipCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-[var(--mf-accent)] text-transparent'}`}>
          <Check size={10} weight="bold" />
        </div>
      </button>
    </div>
  )
}

import { CaretRight, Info } from '@phosphor-icons/react'
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function CycleHistory() {
  return (
    <div className="cycle-history-container">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-medium text-foreground tracking-tight">Cycle history</h2>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Info size={18} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              A historical look at your menstrual cycles and their phases.
            </TooltipContent>
          </Tooltip>
        </div>
        <button className="flex items-center gap-1 text-[1.05rem] text-muted-foreground font-medium hover:text-foreground transition-colors">
          See all <CaretRight size={16} weight="bold" />
        </button>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden">
        {/* Row 1 */}
        <div className="p-5 sm:p-6 relative">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-medium text-foreground mb-0.5">Current cycle: 34 days</h3>
              <p className="text-muted-foreground text-sm">Started Jun 4</p>
            </div>
            <CaretRight size={20} className="text-[#999] mt-2" />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-4">
            {/* Red dots */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={`r-${i}`} className="size-2.5 rounded-full bg-[#dc2626]" />
            ))}
            {/* Light grey dots */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`g1-${i}`} className="size-2.5 rounded-full bg-[#eaeaec]" />
            ))}
            {/* Light teal dots */}
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`t1-${i}`} className="size-2.5 rounded-full bg-[#6fd0cd]" />
            ))}
            {/* Dark teal dot */}
            <div className="size-2.5 rounded-full bg-[#00a59b]" />
            {/* Light teal dots */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`t2-${i}`} className="size-2.5 rounded-full bg-[#6fd0cd]" />
            ))}
            {/* Light grey dots */}
            {Array.from({ length: 11 }).map((_, i) => (
              <div key={`g2-${i}`} className="size-2.5 rounded-full bg-[#eaeaec]" />
            ))}
            {/* Dark grey dots (future) */}
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={`d-${i}`} className="size-2.5 rounded-full bg-[#888]" />
            ))}
          </div>
        </div>

        <div className="h-[1px] w-[calc(100%-3rem)] mx-auto bg-[#f0f0f0]" />

        {/* Row 2 */}
        <div className="p-5 sm:p-6 relative">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-medium text-foreground mb-0.5">27 days</h3>
              <p className="text-muted-foreground text-sm">May 8 – Jun 3</p>
            </div>
            <CaretRight size={20} className="text-[#999] mt-2" />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={`r-${i}`} className="size-2.5 rounded-full bg-[#dc2626]" />
            ))}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={`t1-${i}`} className="size-2.5 rounded-full bg-[#6fd0cd]" />
            ))}
            <div className="size-2.5 rounded-full bg-[#00a59b]" />
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={`t2-${i}`} className="size-2.5 rounded-full bg-[#6fd0cd]" />
            ))}
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={`g-${i}`} className="size-2.5 rounded-full bg-[#eaeaec]" />
            ))}
          </div>
        </div>

        <div className="h-[1px] w-[calc(100%-3rem)] mx-auto bg-[#f0f0f0]" />

        {/* Row 3 */}
        <div className="p-5 sm:p-6 relative">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-medium text-foreground mb-0.5">29 days</h3>
              <p className="text-muted-foreground text-sm">Apr 9 – May 7</p>
            </div>
            <CaretRight size={20} className="text-[#999] mt-2" />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={`r-${i}`} className="size-2.5 rounded-full bg-[#dc2626]" />
            ))}
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={`g1-${i}`} className="size-2.5 rounded-full bg-[#eaeaec]" />
            ))}
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`t1-${i}`} className="size-2.5 rounded-full bg-[#6fd0cd]" />
            ))}
            <div className="size-2.5 rounded-full bg-[#00a59b]" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`t2-${i}`} className="size-2.5 rounded-full bg-[#6fd0cd]" />
            ))}
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={`g2-${i}`} className="size-2.5 rounded-full bg-[#eaeaec]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

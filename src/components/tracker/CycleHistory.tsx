import { CaretRight, Info } from '@phosphor-icons/react'
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useStore } from '@/store/useStore'
import { format, subDays, differenceInDays, parseISO } from 'date-fns'

export function CycleHistory() {
  const { dashboard: data } = useStore()
  
  // 1. Parse the last period start date safely and get typical cycle length
  const currentStart = parseISO(data.lastPeriodStart)
  const typicalCycleDays = data.typicalCycleDays || 28

  // Calculate days elapsed in the current cycle
  const today = new Date()
  const daysElapsed = differenceInDays(today, currentStart)
  const currentCycleDays = daysElapsed >= 0 ? daysElapsed + 1 : 1

  // 2. Generate past cycles dynamically using typicalCycleDays with organic variations
  const cycle2Length = Math.max(21, typicalCycleDays - 1) // e.g. 27 days when typical is 28
  const cycle3Length = Math.max(21, typicalCycleDays + 1) // e.g. 29 days when typical is 28

  // Previous Cycle (Cycle 2)
  const cycle2End = subDays(currentStart, 1)
  const cycle2Start = subDays(cycle2End, cycle2Length - 1)

  // Two Cycles Ago (Cycle 3)
  const cycle3End = subDays(cycle2Start, 1)
  const cycle3Start = subDays(cycle3End, cycle3Length - 1)

  // 3. Dot Generator Helper to build dynamic color-coded dot matrix for the cycles
  const renderDotGrid = (cycleLength: number, totalRenderLength: number, isCurrent: boolean) => {
    const periodLength = 5
    const fertileStart = Math.max(6, Math.min(10, Math.floor(typicalCycleDays * 0.35)))
    const fertileEnd = Math.min(typicalCycleDays - 5, fertileStart + 6)
    const ovulationDay = Math.floor((fertileStart + fertileEnd) / 2)

    return Array.from({ length: totalRenderLength }).map((_, i) => {
      const day = i + 1
      const isFuture = isCurrent && day > cycleLength

      if (isFuture) {
        return (
          <div 
            key={`future-${day}`} 
            className="size-2.5 rounded-full bg-[#888] dark:bg-[#555] opacity-40" 
          />
        )
      }

      if (day <= periodLength) {
        return (
          <div 
            key={`menstrual-${day}`} 
            className="size-2.5 rounded-full bg-[#dc2626]" 
          />
        )
      }
      
      if (day >= fertileStart && day <= fertileEnd) {
        if (day === ovulationDay) {
          return (
            <div 
              key={`ovulation-${day}`} 
              className="size-2.5 rounded-full bg-[#00a59b]" 
            />
          )
        }
        return (
          <div 
            key={`fertile-${day}`} 
            className="size-2.5 rounded-full bg-[#6fd0cd] dark:bg-[#26899e]/80" 
          />
        )
      }

      return (
        <div 
          key={`regular-${day}`} 
          className="size-2.5 rounded-full bg-[#eaeaec] dark:bg-[#362430]" 
        />
      )
    })
  }

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

      <div className="flo-card !p-0 overflow-hidden">
        {/* Row 1: Current Cycle */}
        <div className="p-5 sm:p-6 relative">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-medium text-foreground mb-0.5">
                Current cycle: {currentCycleDays} days
              </h3>
              <p className="text-muted-foreground text-sm">
                Started {format(currentStart, "MMM d")}
              </p>
            </div>
            <CaretRight size={20} className="text-[#999] mt-2" />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-4">
            {renderDotGrid(currentCycleDays, Math.max(currentCycleDays, typicalCycleDays), true)}
          </div>
        </div>

        <div className="h-[1px] w-[calc(100%-3rem)] mx-auto bg-border/50" />

        {/* Row 2: Previous Cycle */}
        <div className="p-5 sm:p-6 relative">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-medium text-foreground mb-0.5">
                {cycle2Length} days
              </h3>
              <p className="text-muted-foreground text-sm">
                {format(cycle2Start, "MMM d")} – {format(cycle2End, "MMM d")}
              </p>
            </div>
            <CaretRight size={20} className="text-[#999] mt-2" />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-4">
            {renderDotGrid(cycle2Length, cycle2Length, false)}
          </div>
        </div>

        <div className="h-[1px] w-[calc(100%-3rem)] mx-auto bg-border/50" />

        {/* Row 3: Two Cycles Ago */}
        <div className="p-5 sm:p-6 relative">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-medium text-foreground mb-0.5">
                {cycle3Length} days
              </h3>
              <p className="text-muted-foreground text-sm">
                {format(cycle3Start, "MMM d")} – {format(cycle3End, "MMM d")}
              </p>
            </div>
            <CaretRight size={20} className="text-[#999] mt-2" />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-4">
            {renderDotGrid(cycle3Length, cycle3Length, false)}
          </div>
        </div>
      </div>
    </div>
  )
}

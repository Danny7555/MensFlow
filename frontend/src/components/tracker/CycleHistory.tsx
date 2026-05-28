import { CaretRight, Info } from '@phosphor-icons/react'
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useStore } from '@/store/useStore'
import { format, differenceInDays, parseISO } from 'date-fns'

interface DotGridProps {
  cycleLength: number
  totalRenderLength: number
  isCurrent: boolean
  typicalCycleDays: number
}

function DotGrid({ cycleLength, totalRenderLength, isCurrent, typicalCycleDays }: DotGridProps) {
  const periodLength = 5
  const fertileStart = Math.max(6, Math.min(10, Math.floor(typicalCycleDays * 0.35)))
  const fertileEnd = Math.min(typicalCycleDays - 5, fertileStart + 6)
  const ovulationDay = Math.floor((fertileStart + fertileEnd) / 2)

  return (
    <>
      {Array.from({ length: totalRenderLength }).map((_, i) => {
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
      })}
    </>
  )
}

export function CycleHistory() {
  const { dashboard: data } = useStore()
  
  // 1. Parse the last period start date safely and get typical cycle length
  const currentStart = parseISO(data.lastPeriodStart)
  const typicalCycleDays = data.typicalCycleDays || 28

  // Calculate days elapsed in the current cycle
  const today = new Date()
  const daysElapsed = differenceInDays(today, currentStart)
  const currentCycleDays = daysElapsed >= 0 ? daysElapsed + 1 : 1

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
            <DotGrid 
              cycleLength={currentCycleDays} 
              totalRenderLength={Math.max(currentCycleDays, typicalCycleDays)} 
              isCurrent={true} 
              typicalCycleDays={typicalCycleDays} 
            />
          </div>
        </div>
      </div>
    </div>
  )
}

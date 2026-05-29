import { Plus, CloudArrowUp, Check, Cloud } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { useStore } from '@/store/useStore'

export function HealthMetrics() {
  const { user, getLogForDate, updateDailyMetrics, isSaving, partnerStatus } = useStore()
  
  const today = format(new Date(), 'yyyy-MM-dd')
  const isPartner = user?.role === 'partner'

  // Determine active values based on role
  let waterVal = 1000
  let weightVal = 62.5

  if (isPartner) {
    waterVal = partnerStatus?.cycle?.water ?? 1000
    weightVal = partnerStatus?.cycle?.weight ?? 62.5
  } else {
    const todayLog = getLogForDate(today)
    waterVal = todayLog?.water ?? 1000
    weightVal = todayLog?.weight ?? 62.5
  }

  const handleIncrementWater = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isPartner) return
    const nextWater = waterVal + 250
    await updateDailyMetrics(today, nextWater, undefined)
  }

  const handleIncrementWeight = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isPartner) return
    const nextWeight = Math.round((weightVal + 0.1) * 10) / 10
    await updateDailyMetrics(today, undefined, nextWeight)
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Dynamic Sync Pill Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Health Metrics</span>
        <div className="h-6 flex items-center">
          {isSaving ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] text-[10px] font-medium animate-pulse border border-[var(--mf-accent-border)]">
              <CloudArrowUp size={12} weight="bold" />
              <span>Syncing with cloud</span>
            </div>
          ) : isPartner ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-medium border border-blue-500/20">
              <Cloud size={12} weight="bold" />
              <span>Synced live from partner</span>
            </div>
          ) : user?.name ? (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-medium border border-emerald-500/20">
              <Check size={12} weight="bold" />
              <span>Cloud synced</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {/* Water Card */}
        <div 
          className={`flo-card !flex-row items-center justify-between group hover:border-[var(--mf-accent-border)] transition-all cursor-pointer ${
            isPartner ? 'opacity-95 hover:!border-border' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <img src="/images/water.png" alt="" className="size-10 object-contain" />
            <div>
              <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Water</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-medium text-foreground">{waterVal}</span>
                <span className="text-xs text-muted-foreground">ml</span>
              </div>
            </div>
          </div>
          {!isPartner ? (
            <button 
              onClick={handleIncrementWater}
              className="size-8 rounded-full bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
              aria-label="Add water"
            >
              <Plus size={16} weight="bold" />
            </button>
          ) : (
            <span className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md font-medium">
              Read-only
            </span>
          )}
        </div>

        {/* Weight Card */}
        <div 
          className={`flo-card !flex-row items-center justify-between group hover:border-[var(--mf-accent-border)] transition-all cursor-pointer ${
            isPartner ? 'opacity-95 hover:!border-border' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <img src="/images/weight.png" alt="" className="size-10 object-cover rounded-xl" />
            <div>
              <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Weight</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-medium text-foreground">{weightVal}</span>
                <span className="text-xs text-muted-foreground">kg</span>
              </div>
            </div>
          </div>
          {!isPartner ? (
            <button 
              onClick={handleIncrementWeight}
              className="size-8 rounded-full bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
              aria-label="Record weight"
            >
              <Plus size={16} weight="bold" />
            </button>
          ) : (
            <span className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md font-medium">
              Read-only
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

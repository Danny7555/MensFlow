export function DashboardSkeleton() {
  return (
    <div className="flex flex-col w-full max-w-[1200px] mx-auto p-6 gap-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-y-2">
        <div className="h-8 w-48 premium-shimmer rounded-full" />
        <div className="h-4 w-72 premium-shimmer rounded-full opacity-85" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        <div className="flex flex-col gap-y-6">
          {/* Wheel/Circular Gauge Shimmer */}
          <div className="premium-skeleton-card rounded-[32px] p-8 flex flex-col items-center justify-center min-h-[340px] gap-y-6 shadow-sm">
            <div className="size-48 rounded-full border-4 border-dashed border-[var(--mf-skeleton-border)] flex items-center justify-center animate-pulse">
              <div className="size-36 rounded-full premium-shimmer flex flex-col items-center justify-center gap-y-2">
                <div className="h-4 w-12 bg-[var(--mf-card)]/50 rounded-full animate-pulse" />
                <div className="h-7 w-20 bg-[var(--mf-card)]/70 rounded-full animate-pulse" />
              </div>
            </div>
            <div className="h-5 w-48 premium-shimmer rounded-full" />
          </div>
          
          {/* Check-in Card placeholder */}
          <div className="premium-skeleton-card rounded-[32px] p-6 flex flex-col gap-y-4 shadow-sm min-h-[192px]">
            <div className="h-6 w-28 premium-shimmer rounded-full" />
            <div className="flex flex-col gap-y-3 pt-2">
              <div className="h-3.5 w-full premium-shimmer rounded-full" />
              <div className="h-3.5 w-5/6 premium-shimmer rounded-full" />
            </div>
          </div>
        </div>
        
        {/* Right side Feed Section Placeholder */}
        <div className="premium-skeleton-card rounded-[32px] p-6 flex flex-col gap-y-6 min-h-[480px] shadow-sm">
          <div className="flex items-center gap-3 pb-3 border-b border-[var(--mf-skeleton-border)]/30">
            <div className="size-10 rounded-2xl premium-shimmer" />
            <div className="h-6 w-32 premium-shimmer rounded-full" />
          </div>
          <div className="flex flex-col gap-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl p-4 flex flex-col gap-y-3 border border-[var(--mf-skeleton-border)]/60 bg-[var(--mf-skeleton-bg)]/20">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full premium-shimmer" />
                  <div className="h-4 w-24 premium-shimmer rounded-full" />
                </div>
                <div className="h-3 w-full premium-shimmer rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

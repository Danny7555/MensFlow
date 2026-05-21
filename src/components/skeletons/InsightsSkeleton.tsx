export function InsightsSkeleton() {
  return (
    <div className="flex flex-col w-full max-w-[1200px] mx-auto p-6 gap-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-y-2">
        <div className="h-8 w-48 premium-shimmer rounded-full" />
        <div className="h-4 w-72 premium-shimmer rounded-full opacity-85" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8">
        <div className="premium-skeleton-card rounded-[32px] p-6 flex flex-col justify-between min-h-[450px] gap-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--mf-skeleton-border)]/40 pb-4">
            <div className="h-6 w-36 premium-shimmer rounded-full" />
            <div className="h-8 w-32 premium-shimmer rounded-full" />
          </div>
          
          {/* Chart Grid mesh placeholder */}
          <div className="flex-1 border-b-2 border-l-2 border-[var(--mf-skeleton-border)]/65 mt-6 relative flex items-end justify-between px-8 py-4 min-h-[220px]">
            <div className="absolute inset-0 flex flex-col justify-between py-6 pointer-events-none opacity-30">
              <div className="border-t border-dashed border-[var(--mf-skeleton-border)]" />
              <div className="border-t border-dashed border-[var(--mf-skeleton-border)]" />
              <div className="border-t border-dashed border-[var(--mf-skeleton-border)]" />
            </div>
            
            {/* Bars pulsing with premium heights */}
            <div className="w-12 h-[35%] premium-shimmer rounded-t-xl" />
            <div className="w-12 h-[65%] premium-shimmer rounded-t-xl opacity-90" />
            <div className="w-12 h-[45%] premium-shimmer rounded-t-xl" />
            <div className="w-12 h-[80%] premium-shimmer rounded-t-xl opacity-90" />
          </div>
        </div>
        
        <div className="premium-skeleton-card rounded-[32px] p-6 flex flex-col gap-y-6 shadow-sm">
          <div className="h-6 w-32 premium-shimmer rounded-full pb-2" />
          <div className="flex flex-col gap-y-4 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl flex items-center justify-between p-4 border border-[var(--mf-skeleton-border)]/50 bg-[var(--mf-skeleton-bg)]/20">
                <div className="size-8 rounded-full premium-shimmer flex-shrink-0" />
                <div className="h-4 w-28 premium-shimmer rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

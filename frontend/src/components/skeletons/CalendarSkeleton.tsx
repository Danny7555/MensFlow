export function CalendarSkeleton() {
  return (
    <div className="flex-1 w-full max-w-[1200px] mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <div className="h-8 w-48 premium-shimmer rounded-full" />
        <div className="h-4 w-72 premium-shimmer rounded-full opacity-85" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        <div className="premium-skeleton-card rounded-[32px] p-6 space-y-6 shadow-sm">
          {/* 7 columns header */}
          <div className="grid grid-cols-7 gap-4 border-b border-[var(--mf-skeleton-border)]/40 pb-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-5 premium-shimmer rounded-full mx-auto w-12" />
            ))}
          </div>
          {/* 7x5 Calendar Grid */}
          <div className="grid grid-cols-7 gap-3 sm:gap-4">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="aspect-square premium-shimmer rounded-2xl flex items-center justify-center border border-[var(--mf-skeleton-border)]/50">
                <div className="size-2 rounded-full bg-[var(--mf-card)]/60 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="premium-skeleton-card rounded-[32px] p-6 space-y-4 shadow-sm min-h-[192px]">
            <div className="h-6 w-32 premium-shimmer rounded-full" />
            <div className="space-y-3 pt-2">
              <div className="h-4 w-full premium-shimmer rounded-full" />
              <div className="h-4 w-2/3 premium-shimmer rounded-full" />
            </div>
          </div>
          <div className="premium-skeleton-card rounded-[32px] p-6 space-y-4 shadow-sm min-h-[256px]">
            <div className="h-6 w-24 premium-shimmer rounded-full" />
            <div className="space-y-3 pt-2">
              <div className="h-10 premium-shimmer rounded-2xl" />
              <div className="h-10 premium-shimmer rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

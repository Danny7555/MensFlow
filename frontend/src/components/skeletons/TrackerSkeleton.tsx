export function TrackerSkeleton() {
  return (
    <div className="flex flex-col w-full max-w-[1200px] mx-auto p-6 gap-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-y-2">
        <div className="h-8 w-40 premium-shimmer rounded-full" />
        <div className="h-4 w-64 premium-shimmer rounded-full opacity-85" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="premium-skeleton-card rounded-[32px] p-6 flex flex-col gap-y-3 min-h-[112px] shadow-sm justify-center">
            <div className="h-4 w-20 premium-shimmer rounded-full" />
            <div className="h-6 w-32 premium-shimmer rounded-full pt-1" />
          </div>
        ))}
      </div>
      
      <div className="premium-skeleton-card rounded-[32px] p-6 min-h-[350px] flex flex-col gap-y-6 shadow-sm">
        <div className="h-6 w-44 premium-shimmer rounded-full pb-2" />
        <div className="flex flex-col gap-y-4 pt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl flex items-center justify-between px-6 border border-[var(--mf-skeleton-border)]/50 bg-[var(--mf-skeleton-bg)]/20">
              <div className="h-4 w-32 premium-shimmer rounded-full" />
              <div className="h-3 w-48 premium-shimmer rounded-full opacity-80" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

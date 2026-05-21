export function SettingsSkeleton() {
  return (
    <div className="flex-1 w-full max-w-[1200px] mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <div className="h-8 w-40 premium-shimmer rounded-full" />
        <div className="h-4 w-56 premium-shimmer rounded-full opacity-85" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
        {/* Left links column */}
        <div className="premium-skeleton-card rounded-[32px] p-4 space-y-2 h-fit shadow-sm">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 premium-shimmer rounded-2xl w-full" />
          ))}
        </div>
        
        {/* Right active tab settings forms */}
        <div className="premium-skeleton-card rounded-[32px] p-8 space-y-6 shadow-sm">
          <div className="h-7 w-32 premium-shimmer rounded-full pb-2" />
          <div className="space-y-6 pt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-[var(--mf-skeleton-border)]/35 last:border-0 gap-4">
                <div className="space-y-2.5">
                  <div className="h-5 w-40 premium-shimmer rounded-full" />
                  <div className="h-3.5 w-64 premium-shimmer rounded-full opacity-80" />
                </div>
                <div className="h-9 w-24 premium-shimmer rounded-full flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

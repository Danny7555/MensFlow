export function TipsSkeleton() {
  return (
    <div className="flex flex-col w-full max-w-[1200px] mx-auto p-6 gap-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-y-2">
        <div className="h-8 w-44 premium-shimmer rounded-full" />
        <div className="h-4 w-80 premium-shimmer rounded-full opacity-85" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="premium-skeleton-card rounded-[32px] p-5 flex flex-col gap-y-4 min-h-[300px]">
            {/* Image box */}
            <div className="h-40 w-full premium-shimmer rounded-2xl" />
            {/* Info text */}
            <div className="flex flex-col gap-y-3 pt-2">
              <div className="h-5 w-2/3 premium-shimmer rounded-full" />
              <div className="flex flex-col gap-y-2">
                <div className="h-3.5 w-full premium-shimmer rounded-full" />
                <div className="h-3.5 w-4/5 premium-shimmer rounded-full opacity-80" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

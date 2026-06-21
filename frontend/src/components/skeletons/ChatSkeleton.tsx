export function ChatSkeleton() {
  return (
    <div className="flex-1 w-full max-w-[1200px] mx-auto p-4 md:p-6 flex gap-8 h-[calc(100vh-140px)] animate-in fade-in duration-500">
      {/* Left History Sidebar (Hidden on mobile) */}
      <div className="hidden md:flex flex-col w-64 premium-skeleton-card rounded-[32px] p-4 gap-y-4">
        <div className="h-6 w-32 premium-shimmer rounded-full mb-2" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 premium-shimmer rounded-2xl w-full" />
        ))}
      </div>
      
      {/* Chat Thread Canvas */}
      <div className="flex-1 flex flex-col justify-between premium-skeleton-card rounded-[32px] p-6">
        <div className="flex flex-col gap-y-6 flex-1 justify-start">
          {/* Assistant message skeleton */}
          <div className="flex items-start gap-3">
            <div className="size-8 rounded-full premium-shimmer flex-shrink-0" />
            <div className="flex flex-col gap-y-2 max-w-[65%]">
              <div className="h-12 premium-shimmer rounded-2xl rounded-tl-none p-4 w-72" />
            </div>
          </div>
          
          {/* User message skeleton */}
          <div className="flex items-start gap-3 self-end justify-end w-full">
            <div className="max-w-[60%] flex flex-col items-end gap-y-2">
              <div className="h-10 premium-shimmer rounded-2xl rounded-tr-none p-4 w-48 opacity-90" />
            </div>
            <div className="size-8 rounded-full premium-shimmer flex-shrink-0" />
          </div>
        </div>
        
        {/* Bottom Chat Composer placeholder */}
        <div className="h-14 premium-shimmer rounded-2xl mt-4 flex items-center justify-between px-4">
          <div className="h-5 w-32 bg-[var(--mf-card)]/50 rounded-full animate-pulse" />
          <div className="size-8 rounded-full bg-[var(--mf-card)]/70 animate-pulse" />
        </div>
      </div>
    </div>
  )
}

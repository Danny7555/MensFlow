import { CycleTrackerHero } from "@/components/tracker/CycleTrackerHero"
import { CycleStatsHero } from "@/components/tracker/CycleStatsHero"
import { CycleHistory } from "@/components/tracker/CycleHistory"
import { CycleTips } from "@/components/tracker/CycleTips"
import { HealthMetrics } from "@/components/tracker/HealthMetrics"
import { useAuth } from "@/context/useAuth"

export function TrackerView() {
  const { isAuthenticated, openAuthModal } = useAuth()

  return (
    <div className="flex flex-col h-full bg-[#fafafa] dark:bg-background overflow-auto relative">
      <div className="flex-1 w-full max-w-[1200px] mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
        <div className="tracker-hero-container pt-2">
           <CycleTrackerHero />
           <CycleStatsHero />
        </div>
        
        <HealthMetrics />
        
        <div className="relative">
          <CycleHistory />
          <CycleTips />
          
          {!isAuthenticated && (
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#fafafa]/80 dark:via-background/80 to-[#fafafa] dark:to-background pointer-events-none z-20 flex flex-col items-center justify-center">
              <div className="absolute inset-0 backdrop-blur-[6px]" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 150px)' }} />
              <div className="relative z-30 pointer-events-auto bg-card border border-border p-8 rounded-3xl text-center max-w-[400px] mx-auto mt-24">
                <h3 className="text-xl font-medium mb-2">Unlock your full history</h3>
                <p className="text-muted-foreground text-sm mb-6">Log in to see your past cycles, personalized tips, and partner sharing features.</p>
                <button 
                  onClick={openAuthModal}
                  className="btn btn-primary px-8 py-3 rounded-full"
                >
                  Log in to access
                </button>
              </div>
            </div>
          )}
        </div>

        {isAuthenticated && (
          <div className="mt-12 mb-16 w-full max-w-[1050px] mx-auto px-2">
            <div className="bg-gradient-to-r from-[var(--mf-accent)] to-[#be185d] rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group cursor-pointer border border-white/10">
              <div className="z-10 text-center md:text-left">
                <h3 className="text-2xl font-medium mb-2">Share your cycle with a partner</h3>
                <p className="text-white/80 max-w-[400px]">
                  Invite your partner to view your cycle phases and symptoms to improve communication and support.
                </p>
              </div>
              <button className="z-10 px-8 py-3 bg-white text-[var(--mf-accent)] rounded-full font-medium hover:scale-105 transition-transform">
                Invite Partner
              </button>
              <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:scale-110 transition-transform duration-700">
                 <img src="/images/girl.png" alt="" className="size-64 object-contain rotate-[-15deg]" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

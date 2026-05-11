import { CycleTrackerHero } from "@/components/tracker/CycleTrackerHero"
import { CycleStatsHero } from "@/components/tracker/CycleStatsHero"
import { CycleHistory } from "@/components/tracker/CycleHistory"
import { CycleTips } from "@/components/tracker/CycleTips"
import { HealthMetrics } from "@/components/tracker/HealthMetrics"

export function TrackerView() {
  return (
    <div className="flex flex-col h-full bg-[#fafafa] dark:bg-background overflow-auto">
      <div className="flex-1 w-full max-w-[1200px] mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
        <div className="tracker-hero-container pt-2">
           <CycleTrackerHero />
           <CycleStatsHero />
        </div>
        
        <HealthMetrics />
        <CycleHistory />
        <CycleTips />

        {/* Partner Sharing Banner - A premium feature inspired by Flo */}
        <div className="mt-12 mb-16 w-full max-w-[1050px] mx-auto px-2">
          <div className="bg-gradient-to-r from-[var(--mf-accent)] to-[#be185d] rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group cursor-pointer shadow-lg">
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
      </div>
    </div>
  )
}

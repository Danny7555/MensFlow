import { CycleTrackerHero } from "@/components/tracker/CycleTrackerHero"
import { CycleStatsHero } from "@/components/tracker/CycleStatsHero"
import { CycleHistory } from "@/components/tracker/CycleHistory"
import { CycleTips } from "@/components/tracker/CycleTips"

export function TrackerView() {
  return (
    <div className="flex flex-col h-full bg-[#fafafa] dark:bg-background overflow-auto">
      <div className="flex-1 w-full max-w-[1200px] mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
        <div className="tracker-hero-container pt-2">
           <CycleTrackerHero />
           <CycleStatsHero />
        </div>
        
        <CycleHistory />
        <CycleTips />
      </div>
    </div>
  )
}

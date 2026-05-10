import { Lightbulb, Info } from '@phosphor-icons/react'

export function CycleTips() {
  return (
    <div className="mt-12 w-full max-w-[1050px] mx-auto mb-16">
      <h2 className="text-2xl font-medium text-foreground tracking-tight mb-6 px-2">Cycle Insights</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-card to-card/50 border border-border rounded-3xl p-6 sm:p-8 shadow-[0_4px_12px_rgba(0,0,0,0.015)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#e25c00] font-medium mb-3 uppercase tracking-wider text-xs">
              <Lightbulb size={20} weight="fill" />
              <span>Follicular Phase Tip</span>
            </div>
            <h3 className="text-xl font-medium text-foreground mb-2 tracking-tight">Energy is on the rise</h3>
            <p className="text-muted-foreground text-[0.95rem] leading-relaxed">
              As your period ends, estrogen begins to rise. You might notice a steady increase in physical energy and improved cognitive focus. This is a fantastic time to schedule challenging workouts, brainstorm new ideas, or tackle complex projects.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-card to-card/50 border border-border rounded-3xl p-6 sm:p-8 shadow-[0_4px_12px_rgba(0,0,0,0.015)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#007e94] font-medium mb-3 uppercase tracking-wider text-xs">
              <Info size={20} weight="fill" />
              <span>Did you know?</span>
            </div>
            <h3 className="text-xl font-medium text-foreground mb-2 tracking-tight">Cycle variations are completely normal</h3>
            <p className="text-muted-foreground text-[0.95rem] leading-relaxed">
              A healthy menstrual cycle can range anywhere from 21 to 35 days. Environmental stressors, travel, sleep disruptions, and intense exercise can occasionally cause your period to arrive a few days early or late.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

import { ChartLineUp, TrendDown, TrendUp } from '@phosphor-icons/react'
import { INSIGHT_TRENDS_DUMMY } from '../data/insightsData'
import { InteractiveAreaChart } from '../components/InteractiveAreaChart'
import { SymptomTrendsChart } from '../components/SymptomTrendsChart'
import { useAuth } from "@/context/useAuth"
import { cn } from '../lib/utils'

export function InsightsView() {
  const { isAuthenticated, openAuthModal } = useAuth()

  return (
    <div className="insights-page relative">
      <section className="insights-section" aria-labelledby="trends-title">
        <h2 id="trends-title" className="insights-section-title">
          Trend summary
        </h2>
        <div className="insight-trends">
          {INSIGHT_TRENDS_DUMMY.map((t) => (
            <div key={t.id} className="insight-trend-card">
              <div className="flex flex-col h-full">
                <span className="insight-trend-label">{t.label}</span>
                <span className="insight-trend-value">{t.value}</span>
                <div className="mt-auto pt-1">
                  <div className={cn(
                    "flex items-center gap-1.5 text-[11px] font-normal w-fit",
                    t.id === '1' && "text-[var(--mf-warning)]",
                    t.id === '2' && "text-[var(--mf-success)]",
                    t.id === '3' && "text-[var(--mf-info)]"
                  )}>
                    {t.id === '1' && <TrendUp size={14} weight="bold" />}
                    {t.id === '2' && <TrendDown size={14} weight="bold" />}
                    {t.id === '3' && <ChartLineUp size={14} weight="bold" />}
                    {t.change}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="relative">
        <section className="insights-section" aria-labelledby="charts-title">
          <h2 id="charts-title" className="insights-section-title">
            Patterns over time
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            <div className="border rounded-xl overflow-hidden bg-card">
              <SymptomTrendsChart />
            </div>
            <div className="border rounded-xl overflow-hidden bg-card">
              <InteractiveAreaChart />
            </div>
          </div>
        </section>

        <section className="insight-narrative-container" aria-labelledby="narrative-title">
          <div className="flex items-center justify-between mb-6">
            <h2 id="narrative-title" className="text-xl font-medium text-foreground">
              What this could mean
            </h2>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] rounded-full border border-[var(--mf-accent-border)]">
              <ChartLineUp size={14} weight="bold" />
              <span className="text-[10px] font-medium uppercase tracking-wider">AI Analysis</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="dash-panel p-5 bg-gradient-to-br from-card to-[var(--mf-accent-soft)]/30 border border-border/50">
              <div className="flex gap-4">
<<<<<<< HEAD
                <div className="text-[var(--mf-accent)] shrink-0 h-fit pt-0.5">
=======
                <div className="p-2.5 bg-[var(--mf-accent-soft)] rounded-lg text-[var(--mf-accent)] shrink-0 h-fit">
>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)
                  <TrendDown size={20} weight="duotone" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-medium text-sm text-foreground">Energy Pattern</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Energy dips clustered in the last week of your cycle - consider lighter training loads there.
                  </p>
                </div>
              </div>
            </div>

            <div className="dash-panel p-5 bg-gradient-to-br from-card to-[var(--mf-accent-soft)]/30 border border-border/50">
              <div className="flex gap-4">
<<<<<<< HEAD
                <div className="text-[var(--mf-accent)] shrink-0 h-fit pt-0.5">
=======
                <div className="p-2.5 bg-[var(--mf-accent-soft)] rounded-lg text-[var(--mf-accent)] shrink-0 h-fit">
>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)
                  <ChartLineUp size={20} weight="duotone" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-medium text-sm text-foreground">Physical Symptoms</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Bloating aligned with late-luteal weeks; salt and sleep hygiene are reasonable experiments.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted/30 rounded-xl border border-dashed border-border text-center">
            <p className="text-xs text-muted-foreground italic">
              When you connect real logs, we&apos;ll swap these paragraphs for data-grounded narrative specifically tailored to your history.
            </p>
          </div>
        </section>

        {!isAuthenticated && (
          <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none z-20 flex flex-col items-center justify-center pt-24">
            <div className="w-full h-full backdrop-blur-[6px] opacity-100" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 pointer-events-auto">
               <div className="bg-card border border-border p-8 rounded-3xl text-center max-w-[400px] mx-auto">
                <h3 className="text-xl font-medium mb-2">Detailed AI Insights</h3>
                <p className="text-muted-foreground text-sm mb-6">Unlock deeper patterns, AI-driven correlations, and symptom history by signing in.</p>
                <button 
                  onClick={openAuthModal}
                  className="btn btn-primary px-8 py-3 rounded-full"
                >
                  Log in to access
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

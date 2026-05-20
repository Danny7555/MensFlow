import { useState, useEffect } from 'react'
import { ChartLineUp, TrendDown, TrendUp } from '@phosphor-icons/react'
import { INSIGHT_TRENDS_DUMMY } from '../data/insightsData'
import { InteractiveAreaChart } from '../components/InteractiveAreaChart'
import { SymptomTrendsChart } from '../components/SymptomTrendsChart'
import { useAuth } from "@/context/useAuth"
import { cn } from '../lib/utils'
import { InsightsSkeleton } from '../components/skeletons/InsightsSkeleton'
import { HormoneWave } from '../components/dashboard/HormoneWave'

export function InsightsView() {
  const { isAuthenticated, openAuthModal } = useAuth()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <InsightsSkeleton />
  }

  return (
    <div className="insights-page relative">
      <HormoneWave />
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
            <div className="border rounded-3xl overflow-hidden bg-card">
              <SymptomTrendsChart />
            </div>
            <div className="border rounded-3xl overflow-hidden bg-card">
              <InteractiveAreaChart />
            </div>
          </div>
        </section>


        {!isAuthenticated && (
          <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none z-20 flex flex-col items-center justify-center pt-24">
            <div className="w-full h-full backdrop-blur-[6px] opacity-100" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 pointer-events-auto">
               <div className="bg-card border border-border p-8 rounded-3xl text-center max-w-[400px] mx-auto">
                <h3 className="text-xl font-normal mb-2">Detailed AI Insights</h3>
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

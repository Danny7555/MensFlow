import { ChartLineUp, TrendDown, TrendUp } from '@phosphor-icons/react'
import { INSIGHT_TRENDS_DUMMY } from '../data/insightsData'
import { InteractiveAreaChart } from '../components/InteractiveAreaChart'
import { cn } from '../lib/utils'

export function InsightsView() {
  return (
    <div className="insights-page">


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
                <div className="mt-auto pt-3">
                  <div className={cn(
                    "flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-md w-fit",
                    t.id === '1' && "bg-[var(--mf-warning-soft)] text-[var(--mf-warning)]",
                    t.id === '2' && "bg-[var(--mf-success-soft)] text-[var(--mf-success)]",
                    t.id === '3' && "bg-[var(--mf-info-soft)] text-[var(--mf-info)]"
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

      <section className="insights-section" aria-labelledby="charts-title">
        <h2 id="charts-title" className="insights-section-title">
          Patterns over time
        </h2>
        <div className="mt-4 border rounded-xl overflow-hidden bg-card">
          <InteractiveAreaChart />
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
              <div className="p-2.5 bg-[var(--mf-accent-soft)] rounded-lg text-[var(--mf-accent)] shrink-0 h-fit">
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
              <div className="p-2.5 bg-[var(--mf-accent-soft)] rounded-lg text-[var(--mf-accent)] shrink-0 h-fit">
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
    </div>
  )
}

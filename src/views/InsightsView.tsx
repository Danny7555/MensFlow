import { ChartLineUp, TrendDown, TrendUp } from '@phosphor-icons/react'
import {
  INSIGHT_METRICS_DUMMY,
  INSIGHT_TRENDS_DUMMY,
} from '../data/insightsData'

export function InsightsView() {
  return (
    <div className="insights-page">
      <header className="page-hero">
        <div className="page-hero-icon">
          <ChartLineUp size={26} weight="duotone" aria-hidden />
        </div>
        <h1 className="page-hero-title">Health insights</h1>
        <p className="page-hero-desc">
          Dummy trends and patterns — replace with analytics from your tracker and logs when integrated.
        </p>
      </header>

      <section className="insights-section" aria-labelledby="trends-title">
        <h2 id="trends-title" className="insights-section-title">
          Trend summary
        </h2>
        <div className="insight-trends">
          {INSIGHT_TRENDS_DUMMY.map((t) => (
            <div key={t.id} className="insight-trend-card">
              <span className="insight-trend-label">{t.label}</span>
              <span className="insight-trend-value">{t.value}</span>
              <span
                className={`insight-trend-change ${t.positive ? 'insight-trend-change--up' : 'insight-trend-change--flat'}`}
              >
                {t.positive ? (
                  <TrendUp size={16} aria-hidden />
                ) : (
                  <TrendDown size={16} aria-hidden />
                )}
                {t.change}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="insights-section" aria-labelledby="charts-title">
        <h2 id="charts-title" className="insights-section-title">
          Patterns over time
        </h2>
        <div className="insight-metrics">
          {INSIGHT_METRICS_DUMMY.map((m) => {
            const max = Math.max(...m.bars, 1)
            return (
              <div key={m.id} className="insight-metric-panel">
                <h3 className="insight-metric-title">{m.title}</h3>
                <div className="insight-bars" role="img" aria-label={m.caption}>
                  {m.bars.map((v, i) => (
                    <div key={i} className="insight-bar-wrap">
                      <div
                        className="insight-bar-fill"
                        style={{ height: `${(v / max) * 100}%` }}
                      />
                    </div>
                  ))}
                </div>
                <p className="insight-metric-caption">{m.caption}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="dash-panel insight-narrative" aria-labelledby="narrative-title">
        <h2 id="narrative-title" className="dash-panel-title">
          What this could mean (demo copy)
        </h2>
        <ul className="insight-bullets">
          <li>
            Energy dips clustered in the last week of your cycle — consider lighter training loads there.
          </li>
          <li>
            Bloating aligned with late-luteal weeks; salt and sleep hygiene are reasonable experiments (not medical advice).
          </li>
          <li>
            When you connect real logs, we&apos;ll swap these paragraphs for data-grounded narrative.
          </li>
        </ul>
      </section>
    </div>
  )
}

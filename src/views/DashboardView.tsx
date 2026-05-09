import { useMemo } from 'react'
import { CalendarBlank, ClipboardText } from '@phosphor-icons/react'
import { useDashboardData } from '../context/useDashboardData'

function computeCycleDay(startIso: string, cycleLen: number) {
  const start = new Date(`${startIso}T12:00:00`)
  if (Number.isNaN(+start)) return 1
  const days = Math.floor((Date.now() - +start) / 86400000)
  const m = ((days % cycleLen) + cycleLen) % cycleLen
  return m + 1
}

export function DashboardView() {
  const { data, update, lastSaved } = useDashboardData()

  const cycleDay = useMemo(
    () => computeCycleDay(data.lastPeriodStart, data.typicalCycleDays),
    [data.lastPeriodStart, data.typicalCycleDays],
  )

  const fmtSaved =
    lastSaved?.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }) ?? '—'

  const guidanceText = data.guidanceLines.join('\n')

  return (
    <div className="dashboard-live">
      <header className="dash-header">
        <div>
          <p className="dash-kicker">Home</p>
          <h1 className="dash-title">Your overview</h1>
          <p className="dash-sub">
            Edit anything below — it saves to this browser for a realistic workflow demo.
          </p>
        </div>
        <div className="dash-header-meta">
          <span className="dash-pill">
            <CalendarBlank size={16} aria-hidden />
            Cycle day {cycleDay} · {data.typicalCycleDays}d typical length
          </span>
          <span className="dash-pill dash-pill--muted">
            Saved {fmtSaved}
          </span>
        </div>
      </header>

      <div className="dash-stats-row">
        <div className="dash-stat">
          <span className="dash-stat-label">Projected phase</span>
          <span className="dash-stat-value">{data.phaseLabel}</span>
          <span className="dash-stat-hint">From your last updated snapshot</span>
        </div>
        <div className="dash-stat">
          <span className="dash-stat-label">Hormone focus</span>
          <span className="dash-stat-value dash-stat-value--sm">
            {data.hormoneTrend}
          </span>
          <span className="dash-stat-hint">Educational framing, not lab data</span>
        </div>
        <div className="dash-stat">
          <span className="dash-stat-label">Last period start</span>
          <span className="dash-stat-value dash-stat-value--sm">
            {data.lastPeriodStart}
          </span>
          <span className="dash-stat-hint">Update in Your snapshot below</span>
        </div>
      </div>

      <div className="dash-overview-body">
        <div className="dash-row-panels">
          <section className="dash-panel" aria-labelledby="phase-heading">
            <div className="dash-panel-head">
              <h2 id="phase-heading" className="dash-panel-title">
                Today&apos;s hormonal phase
              </h2>
            </div>
            <dl className="dash-dl">
              <div className="dash-dl-row">
                <dt>Phase</dt>
                <dd>
                  <input
                    type="text"
                    className="dash-input dash-input--inline"
                    value={data.phaseLabel}
                    onChange={(e) => update({ phaseLabel: e.target.value })}
                    aria-label="Phase label"
                  />
                </dd>
              </div>
              <div className="dash-dl-row">
                <dt>Hormone trend</dt>
                <dd>
                  <input
                    type="text"
                    className="dash-input dash-input--inline"
                    value={data.hormoneTrend}
                    onChange={(e) => update({ hormoneTrend: e.target.value })}
                  />
                </dd>
              </div>
              <div className="dash-dl-row">
                <dt>Body signals</dt>
                <dd>
                  <input
                    type="text"
                    className="dash-input dash-input--inline"
                    value={data.bodySignals}
                    onChange={(e) => update({ bodySignals: e.target.value })}
                  />
                </dd>
              </div>
            </dl>
          </section>

          <section className="dash-panel" aria-labelledby="guide-heading">
            <div className="dash-panel-head">
              <h2 id="guide-heading" className="dash-panel-title">
                Today&apos;s health guidance
              </h2>
            </div>
            <textarea
              className="dash-textarea dash-textarea--guidance"
              aria-label="Guidance list — one line per tip"
              rows={5}
              value={guidanceText}
              onChange={(e) => {
                const lines = e.target.value
                  .split('\n')
                  .map((s) => s.trim())
                  .filter(Boolean)
                update({ guidanceLines: lines })
              }}
            />
            <p className="dash-hint">
              One short tip per line — your dashboard and Tips view both read from here in this demo.
            </p>
          </section>
        </div>

        <section
          className="dash-panel dash-panel--snapshot"
          aria-labelledby="snapshot-heading"
        >
          <div className="dash-panel-head">
            <h2 id="snapshot-heading" className="dash-panel-title">
              <ClipboardText size={20} aria-hidden />
              Your snapshot
            </h2>
          </div>
          <div className="dash-snapshot-body">
            <p className="dash-snapshot-lede">
              Update cycle basics and notes when your real-world data changes.
            </p>

            <div className="dash-snapshot-form">
              <div className="dash-snapshot-field">
                <label className="dash-field-label" htmlFor="dash-last-period">
                  Last period start
                </label>
                <input
                  id="dash-last-period"
                  type="date"
                  className="dash-input dash-input--fill"
                  value={data.lastPeriodStart}
                  onChange={(e) => update({ lastPeriodStart: e.target.value })}
                />
              </div>

              <div className="dash-snapshot-field">
                <label className="dash-field-label" htmlFor="dash-cycle-len">
                  Typical cycle length (days)
                </label>
                <input
                  id="dash-cycle-len"
                  type="number"
                  min={21}
                  max={45}
                  className="dash-input dash-input--fill"
                  value={data.typicalCycleDays}
                  onChange={(e) =>
                    update({
                      typicalCycleDays: Math.min(
                        45,
                        Math.max(21, Number(e.target.value) || 28),
                      ),
                    })
                  }
                />
              </div>

              <div className="dash-snapshot-field dash-snapshot-field--wide">
                <label className="dash-field-label" htmlFor="dash-notes">
                  Private notes
                </label>
                <textarea
                  id="dash-notes"
                  className="dash-textarea dash-textarea--snapshot"
                  rows={5}
                  placeholder="Symptoms, meds, questions for your clinician…"
                  value={data.cycleNotes}
                  onChange={(e) => update({ cycleNotes: e.target.value })}
                />
              </div>

              <p className="dash-snapshot-foot">
                Edits persist automatically in this browser session.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

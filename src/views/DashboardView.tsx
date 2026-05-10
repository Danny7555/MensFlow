import { useMemo, useState } from 'react'
import {
  CalendarBlank,
  ClipboardText,
  PencilSimple,
  Check,
  Calendar as CalendarIcon,
} from '@phosphor-icons/react'
import { format, parseISO } from 'date-fns'
import { Calendar } from '../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover'
import { Button } from '../components/ui/button'
import { cn } from '../lib/utils'
import { useDashboardData } from '../context/useDashboardData'

function computeCycleDay(startIso: string, cycleLen: number) {
  const start = new Date(`${startIso}T12:00:00`)
  if (Number.isNaN(+start)) return 1
  const days = Math.floor((Date.now() - +start) / 86400000)
  const m = ((days % cycleLen) + cycleLen) % cycleLen
  return m + 1
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function DashboardView() {
  const { data, update, lastSaved } = useDashboardData()
  const [isEditingGuidance, setIsEditingGuidance] = useState(false)

  const cycleDay = useMemo(
    () => computeCycleDay(data.lastPeriodStart, data.typicalCycleDays),
    [data.lastPeriodStart, data.typicalCycleDays],
  )

  const fmtSaved =
    lastSaved?.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }) ?? '-'

  const guidanceText = data.guidanceLines.join('\n')

  const selectedDate = useMemo(() => {
    try {
      return data.lastPeriodStart ? parseISO(data.lastPeriodStart) : undefined
    } catch {
      return undefined
    }
  }, [data.lastPeriodStart])

  return (
    <div className="dashboard-live">
      <header className="dash-header">
        <div>
          <p className="dash-kicker">Home</p>
          <h1 className="dash-title">{getGreeting()}, Daniella</h1>
          <p className="dash-sub">
            Here&apos;s your cycle overview and health insights for today.
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
                <dd>{data.phaseLabel}</dd>
              </div>
              <div className="dash-dl-row">
                <dt>Hormone trend</dt>
                <dd>{data.hormoneTrend}</dd>
              </div>
              <div className="dash-dl-row">
                <dt>Body signals</dt>
                <dd>{data.bodySignals}</dd>
              </div>
            </dl>
          </section>

          <section className="dash-panel" aria-labelledby="guide-heading">
            <div className="dash-panel-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 id="guide-heading" className="dash-panel-title">
                Today&apos;s health guidance
              </h2>
              <button
                type="button"
                onClick={() => setIsEditingGuidance(!isEditingGuidance)}
                aria-label={isEditingGuidance ? "Save guidance" : "Edit guidance"}
                className="icon-btn"
                style={{ padding: '0.25rem' }}
              >
                {isEditingGuidance ? (
                  <Check size={18} className="text-primary" aria-hidden />
                ) : (
                  <PencilSimple size={18} className="text-muted-foreground opacity-50 hover:opacity-100 transition-opacity" aria-hidden />
                )}
              </button>
            </div>
            {isEditingGuidance ? (
              <>
                <textarea
                  className="dash-textarea dash-textarea--guidance"
                  aria-label="Guidance list - one line per tip"
                  rows={5}
                  value={guidanceText}
                  onChange={(e) => {
                    const lines = e.target.value
                      .split('\n')
                      .flatMap((s) => s.trim() ? [s.trim()] : [])
                    update({ guidanceLines: lines })
                  }}
                />
                <p className="dash-hint">
                  One short tip per line - your dashboard and Tips view both read from here in this demo.
                </p>
              </>
            ) : (
              <div style={{ flex: 1, padding: '0.5rem 1.25rem 1.25rem' }}>
                <ul className="guidance-list">
                  {data.guidanceLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            )}
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="dash-last-period"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-card h-10 border-border",
                        !data.lastPeriodStart && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon size={16} className="mr-2 opacity-60" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(day) => {
                        if (day) {
                          update({ lastPeriodStart: format(day, "yyyy-MM-dd") })
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
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

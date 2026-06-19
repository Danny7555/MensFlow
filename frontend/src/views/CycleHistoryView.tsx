/* eslint-disable */
import React, { useMemo, useState } from 'react'
import { m } from 'framer-motion'
import {
  CalendarBlank, Drop, TrendUp, Clock, Calendar,
  ArrowLeft, ArrowRight, DownloadSimple,
} from '@phosphor-icons/react'
import { useStore } from '../store/useStore'
import { calculatePeriodsFromLogs, computeCycleDay } from '../lib/cycleUtils'
import { format, parseISO } from 'date-fns'

const COLORS = ['#f43f5e', '#0d9488', '#d97706', '#7c3aed', '#0284c7']

function StatBox({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="size-9 rounded-xl flex items-center justify-center shrink-0 bg-[var(--mf-accent-soft)]">
        {icon}
      </div>
      <div className="min-w-0">
        <span className="text-[10px] uppercase tracking-wider text-[var(--mf-muted)] block">{label}</span>
        <p className="text-sm text-[var(--mf-text-strong)] font-semibold">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function CycleBar({ length, maxLen, label, index }: { length: number; maxLen: number; label: string; index: number }) {
  const pct = Math.max(8, (length / maxLen) * 100)
  const color = COLORS[index % COLORS.length]
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-xs text-muted-foreground w-16 shrink-0">{label}</span>
      <div className="flex-1 h-7 rounded-lg bg-[var(--mf-elevated)] overflow-hidden relative">
        <m.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, delay: index * 0.08, ease: 'easeOut' }}
          className="h-full rounded-lg flex items-center justify-end px-2"
          style={{ backgroundColor: color, opacity: 0.75 }}
        >
          <span className="text-[11px] text-white font-semibold">{length}d</span>
        </m.div>
      </div>
    </div>
  )
}

export function CycleHistoryView() {
  const { logs, dashboard } = useStore()
  const [page, setPage] = useState(0)

  const periods = useMemo(() => calculatePeriodsFromLogs(logs || []), [logs])

  const currentCycleDay = computeCycleDay(dashboard.lastPeriodStart, dashboard.typicalCycleDays)

  const maxLen = Math.max(...periods.map(p => p.cycleLength || 0), 28)

  const avgCycleLen = periods.length > 0
    ? Math.round(periods.reduce((a, p) => a + (p.cycleLength || 0), 0) / periods.length)
    : 0

  const avgPeriodLen = periods.length > 0
    ? Math.round(periods.reduce((a, p) => a + p.duration, 0) / periods.length)
    : 0

  const totalCycles = periods.length

  return (
    <div className="dashboard-flo-theme relative min-h-screen animate-in fade-in duration-300">
      <main className="flo-main-container pb-24 md:pb-32 pt-6 md:pt-10">
        <div className="flo-content-inner max-w-2xl mx-auto">
          <div className="mb-6 px-1">
            <h1 className="text-2xl md:text-[28px] font-semibold text-[var(--mf-text-strong)] tracking-tight">Cycle History</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{totalCycles} recorded {totalCycles === 1 ? 'cycle' : 'cycles'}</p>
          </div>

          {/* Stats summary — dashboard-style stat rows */}
          <div className="flo-card flo-card--prominent p-6 border-[var(--mf-border-strong)] bg-white dark:bg-[var(--mf-card)] text-left rounded-2xl mb-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <span className="text-[9px] font-regular text-[var(--mf-accent)] uppercase tracking-[0.2em] block mb-0.5">Overview</span>
                <h3 className="text-base font-regular text-[var(--mf-text-strong)] flex items-center gap-1.5 font-semibold">
                  Your Cycle at a Glance
                </h3>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatBox
                  icon={<Calendar size={18} weight="fill" className="text-rose-500" />}
                  label="Avg Cycle Length"
                  value={avgCycleLen ? `${avgCycleLen} days` : 'Not enough data'}
                  sub={avgCycleLen ? `Based on ${totalCycles} cycles` : 'Log more periods to see trends'}
                />
                <StatBox
                  icon={<Drop size={18} weight="fill" className="text-[var(--mf-accent)]" />}
                  label="Avg Period Duration"
                  value={avgPeriodLen ? `${avgPeriodLen} ${avgPeriodLen === 1 ? 'day' : 'days'}` : 'Not enough data'}
                  sub={avgPeriodLen ? `Your periods typically last ${avgPeriodLen} ${avgPeriodLen === 1 ? 'day' : 'days'}` : ''}
                />
                <StatBox
                  icon={<Clock size={18} weight="fill" className="text-amber-500" />}
                  label="Current Cycle"
                  value={`Day ${currentCycleDay}`}
                  sub={`Cycle day based on your last period start`}
                />
              </div>
            </div>
          </div>

          {/* Cycle length chart */}
          {periods.length > 0 ? (
            <div className="flo-card flo-card--prominent p-6 border-[var(--mf-border-strong)] bg-white dark:bg-[var(--mf-card)] rounded-2xl space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[var(--mf-text-strong)] flex items-center gap-2">
                  <TrendUp size={16} className="text-[var(--mf-accent)]" />
                  Cycle Lengths
                </h2>
              </div>
              <div className="space-y-1">
                {periods.slice(page * 6, page * 6 + 6).map((p, i) => (
                  <CycleBar
                    key={p.startDate}
                    length={p.cycleLength || 0}
                    maxLen={maxLen}
                    label={format(parseISO(p.startDate), 'MMM yyyy')}
                    index={page * 6 + i}
                  />
                ))}
              </div>
              {periods.length > 6 && (
                <div className="flex items-center justify-between pt-2 border-t border-[var(--mf-border)]">
                  <button
                    type="button"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-[var(--mf-text-strong)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={14} /> Previous
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {page + 1} / {Math.ceil(periods.length / 6)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage(p => Math.min(Math.ceil(periods.length / 6) - 1, p + 1))}
                    disabled={page >= Math.ceil(periods.length / 6) - 1}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-[var(--mf-text-strong)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Next <ArrowRight size={14} />
                  </button>
                </div>
              )}

              {/* Period list */}
              <div className="pt-2 border-t border-[var(--mf-border)]">
                <h3 className="text-xs font-semibold text-[var(--mf-text-strong)] mb-3">Past Periods</h3>
                <div className="space-y-2">
                  {periods.slice(page * 6, page * 6 + 6).map(p => (
                    <div key={p.startDate} className="flex items-center justify-between py-1.5 text-xs">
                      <span className="text-muted-foreground">{format(parseISO(p.startDate), 'MMM d, yyyy')}</span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[var(--mf-text-strong)]">
                          <Drop size={12} className="text-rose-500" />
                          {p.duration} {p.duration === 1 ? 'day' : 'days'}
                        </span>
                        {p.cycleLength && (
                          <span className="text-muted-foreground">Cycle: {p.cycleLength}d</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="size-16 rounded-2xl bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] flex items-center justify-center">
                <CalendarBlank size={32} weight="thin" />
              </div>
              <div className="text-center space-y-1.5 max-w-xs">
                <p className="text-base font-semibold text-[var(--mf-text-strong)]">No cycle history yet</p>
                <p className="text-sm text-muted-foreground">Start logging your periods to see your history here.</p>
              </div>
            </div>
          )}

          {/* CSV Export */}
          {periods.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const csv = 'Start Date,Duration (days),Cycle Length (days)\n' +
                  periods.map(p => `${p.startDate},${p.duration},${p.cycleLength || ''}`).join('\n')
                const blob = new Blob([csv], { type: 'text/csv' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `mensflow-cycle-history-${new Date().toISOString().split('T')[0]}.csv`
                a.click()
                URL.revokeObjectURL(url)
              }}
              className="mt-4 w-full py-3 rounded-2xl border border-[var(--mf-border)] text-sm font-medium text-[var(--mf-text-strong)] hover:bg-[var(--mf-elevated)] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <DownloadSimple size={16} />
              Export Cycle History (CSV)
            </button>
          )}
        </div>
      </main>
    </div>
  )
}

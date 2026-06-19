/* eslint-disable */
import { useState, useMemo } from 'react'
import {
  ArrowLeft, ArrowRight,
  Heart, ChartBar, Smiley,
} from '@phosphor-icons/react'
import { useStore } from '../store/useStore'
import { format, parseISO, differenceInDays } from 'date-fns'

interface CycleSummary {
  startDate: string
  endDate: string
  duration: number
  cycleLength: number | null
  symptoms: Record<string, number>
  moods: Record<string, number>
  totalLogs: number
}

function summarizeCycle(logs: Array<{ date: string; symptoms: string[] }>, startStr: string, endStr: string): CycleSummary {
  const start = parseISO(startStr)
  const end = parseISO(endStr)
  const inRange = (logs || []).filter(l => {
    const d = parseISO(l.date)
    return d >= start && d <= end
  })

  const symptoms: Record<string, number> = {}
  const moods: Record<string, number> = {}
  const physKeys = ['phys-cramps', 'phys-fatigue', 'phys-headache', 'phys-bloating', 'phys-tender', 'phys-acne']
  const moodKeys = ['mood-happy', 'mood-calm', 'mood-sad', 'mood-irritable', 'mood-anxious']

  for (const log of inRange) {
    for (const s of log.symptoms) {
      if (physKeys.includes(s)) symptoms[s] = (symptoms[s] || 0) + 1
      if (moodKeys.includes(s)) moods[s] = (moods[s] || 0) + 1
    }
  }

  const duration = differenceInDays(end, start) + 1
  return {
    startDate: startStr,
    endDate: endStr,
    duration,
    cycleLength: null,
    symptoms,
    moods,
    totalLogs: inRange.length,
  }
}

const MOOD_LABELS: Record<string, string> = {
  'mood-happy': 'Happy',
  'mood-calm': 'Calm',
  'mood-sad': 'Sad',
  'mood-irritable': 'Irritable',
  'mood-anxious': 'Anxious',
}

const SYMPTOM_LABELS: Record<string, string> = {
  'phys-cramps': 'Cramps',
  'phys-fatigue': 'Fatigue',
  'phys-headache': 'Headache',
  'phys-bloating': 'Bloating',
  'phys-tender': 'Tender',
  'phys-acne': 'Acne',
}

function CycleCard({ cycle, label }: { cycle: CycleSummary | null; label: string }) {
  if (!cycle) {
    return (
      <div className="flex-1 bg-white dark:bg-[var(--mf-card)] rounded-2xl border border-[var(--mf-border)] p-5 flex items-center justify-center min-h-[200px]">
        <p className="text-xs text-muted-foreground">Select a cycle to compare</p>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-white dark:bg-[var(--mf-card)] rounded-2xl border border-[var(--mf-border)] p-4 md:p-5 space-y-4">
      <div className="text-center">
        <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--mf-accent)] font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{format(parseISO(cycle.startDate), 'MMM d')} – {format(parseISO(cycle.endDate), 'MMM d, yyyy')}</p>
        <p className="text-xs text-[var(--mf-text-strong)] font-medium mt-1">{cycle.duration} days · {cycle.totalLogs} logs</p>
      </div>

      <div>
        <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center gap-1.5">
          <Smiley size={12} /> Mood
        </h4>
        <div className="space-y-1">
          {Object.entries(MOOD_LABELS).map(([key, label]) => {
            const count = cycle.moods[key] || 0
            const max = Math.max(...Object.values(cycle.moods), 1)
            return (
              <div key={key} className="flex items-center gap-2 text-xs">
                <span className="w-14 text-muted-foreground">{label}</span>
                <div className="flex-1 h-4 rounded bg-[var(--mf-elevated)] overflow-hidden">
                  <div className="h-full rounded bg-[var(--mf-accent)] transition-all" style={{ width: `${(count / max) * 100}%`, opacity: 0.6 }} />
                </div>
                <span className="w-4 text-right text-muted-foreground">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center gap-1.5">
          <Heart size={12} /> Symptoms
        </h4>
        <div className="space-y-1">
          {Object.entries(SYMPTOM_LABELS).map(([key, label]) => {
            const count = cycle.symptoms[key] || 0
            const max = Math.max(...Object.values(cycle.symptoms), 1)
            return (
              <div key={key} className="flex items-center gap-2 text-xs">
                <span className="w-14 text-muted-foreground">{label}</span>
                <div className="flex-1 h-4 rounded bg-[var(--mf-elevated)] overflow-hidden">
                  <div className="h-full rounded bg-rose-400 transition-all" style={{ width: `${(count / max) * 100}%`, opacity: 0.7 }} />
                </div>
                <span className="w-4 text-right text-muted-foreground">{count}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function CycleCompareView() {
  const { logs } = useStore()
  const [cycleIndex, setCycleIndex] = useState(0)

  const cycles = useMemo(() => {
    const flowLogs = (logs || [])
      .filter(l => l.symptoms.some(s => s.startsWith('flow-')))
      .sort((a, b) => a.date.localeCompare(b.date))

    const starts: string[] = []
    let prevDate: string | null = null
    for (const log of flowLogs) {
      if (!prevDate || differenceInDays(parseISO(log.date), parseISO(prevDate)) > 4) {
        starts.push(log.date)
      }
      prevDate = log.date
    }

    return starts.map((start, i) => {
      const end = i < starts.length - 1
        ? format(new Date(parseISO(starts[i + 1]).getTime() - 86400000), 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd')
      return summarizeCycle(logs, start, end)
    }).reverse()
  }, [logs])

  const current = cycles[cycleIndex] || null
  const previous = cycles[cycleIndex + 1] || null

  return (
    <div className="dashboard-flo-theme relative min-h-screen animate-in fade-in duration-300">
      <main className="flo-main-container pb-24 md:pb-32 pt-6 md:pt-10">
        <div className="flo-content-inner max-w-3xl mx-auto">
          <div className="mb-6 px-1">
            <h1 className="text-2xl md:text-[28px] font-semibold text-[var(--mf-text-strong)] tracking-tight">Compare Cycles</h1>
            <p className="text-sm text-muted-foreground mt-0.5">See how your cycles compare side by side</p>
          </div>

          {cycles.length >= 2 ? (
            <>
              <div className="flex items-center justify-between mb-4 px-1">
                <button
                  type="button"
                  onClick={() => setCycleIndex(p => Math.min(cycles.length - 2, p + 1))}
                  disabled={cycleIndex >= cycles.length - 2}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-[var(--mf-text-strong)] disabled:opacity-30 cursor-pointer transition-colors"
                >
                  <ArrowLeft size={14} /> Previous
                </button>
                <span className="text-xs text-muted-foreground">
                  Cycle {cycleIndex + 1} vs {cycleIndex + 2}
                </span>
                <button
                  type="button"
                  onClick={() => setCycleIndex(p => Math.max(0, p - 1))}
                  disabled={cycleIndex === 0}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-[var(--mf-text-strong)] disabled:opacity-30 cursor-pointer transition-colors"
                >
                  Next <ArrowRight size={14} />
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <CycleCard cycle={current} label="This Cycle" />
                <CycleCard cycle={previous} label="Previous Cycle" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="size-16 rounded-2xl bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] flex items-center justify-center">
                <ChartBar size={32} weight="thin" />
              </div>
              <div className="text-center space-y-1.5 max-w-xs">
                <p className="text-base font-semibold text-[var(--mf-text-strong)]">Need more data</p>
                <p className="text-sm text-muted-foreground">Log at least two cycles to start comparing.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

import { useMemo, useState, useEffect } from 'react'
import { getPhaseFromDay } from '../../lib/cycleUtils'

interface Log {
  date: string
  symptoms: string[]
}

let rechartsPromise: Promise<typeof import('recharts')> | null = null
function loadRecharts() {
  if (!rechartsPromise) {
    rechartsPromise = import('recharts')
  }
  return rechartsPromise
}

export function SymptomCorrelationChart({
  logs,
  lastPeriodStart,
  typicalCycleDays,
}: {
  logs: Log[]
  lastPeriodStart: string
  typicalCycleDays: number
}) {
  const [recharts, setRecharts] = useState<any>(null)

  useEffect(() => {
    loadRecharts().then(setRecharts)
  }, [])

  const symptomCorrelationData = useMemo(() => {
    if (!logs || logs.length === 0) return []
    const startIso = lastPeriodStart || new Date().toISOString().split('T')[0]
    const cycleLen = typicalCycleDays || 28

    const counts: Record<string, Record<string, number>> = {
      menstrual: { Cramps: 0, Fatigue: 0, Bloating: 0, Headache: 0, Mood: 0 },
      follicular: { Cramps: 0, Fatigue: 0, Bloating: 0, Headache: 0, Mood: 0 },
      fertile: { Cramps: 0, Fatigue: 0, Bloating: 0, Headache: 0, Mood: 0 },
      luteal: { Cramps: 0, Fatigue: 0, Bloating: 0, Headache: 0, Mood: 0 },
    }

    logs.forEach((log) => {
      const start = new Date(`${startIso}T12:00:00`)
      const current = new Date(`${log.date}T12:00:00`)
      if (Number.isNaN(start.getTime()) || Number.isNaN(current.getTime())) return
      const daysDiff = Math.floor((current.getTime() - start.getTime()) / 86400000)
      const cycleDay = ((daysDiff % cycleLen) + cycleLen) % cycleLen + 1
      const phase = getPhaseFromDay(cycleDay, cycleLen)

      log.symptoms.forEach((sId) => {
        if (sId.includes('cramps') || sId.includes('pelvicpain')) {
          counts[phase].Cramps++
        } else if (sId.includes('fatigue') || sId.includes('brainfog')) {
          counts[phase].Fatigue++
        } else if (sId.includes('bloating')) {
          counts[phase].Bloating++
        } else if (sId.includes('headache') || sId.includes('backache')) {
          counts[phase].Headache++
        } else if (sId.includes('mood-') && sId !== 'mood-calm' && sId !== 'mood-happy') {
          counts[phase].Mood++
        }
      })
    })

    return [
      { name: 'Menstrual', Cramps: counts.menstrual.Cramps, Fatigue: counts.menstrual.Fatigue, Bloating: counts.menstrual.Bloating, Headache: counts.menstrual.Headache, Mood: counts.menstrual.Mood },
      { name: 'Follicular', Cramps: counts.follicular.Cramps, Fatigue: counts.follicular.Fatigue, Bloating: counts.follicular.Bloating, Headache: counts.follicular.Headache, Mood: counts.follicular.Mood },
      { name: 'Ovulatory', Cramps: counts.fertile.Cramps, Fatigue: counts.fertile.Fatigue, Bloating: counts.fertile.Bloating, Headache: counts.fertile.Headache, Mood: counts.fertile.Mood },
      { name: 'Luteal', Cramps: counts.luteal.Cramps, Fatigue: counts.luteal.Fatigue, Bloating: counts.luteal.Bloating, Headache: counts.luteal.Headache, Mood: counts.luteal.Mood },
    ]
  }, [logs, lastPeriodStart, typicalCycleDays])

  if (symptomCorrelationData.every(p => p.Cramps === 0 && p.Fatigue === 0 && p.Bloating === 0 && p.Headache === 0 && p.Mood === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
         <p className="text-sm font-semibold text-muted-foreground">No symptoms logged yet</p>
         <p className="text-xs text-muted-foreground/80 mt-1">Start logging symptoms in the Symptom Tracker to see correlations here.</p>
      </div>
    )
  }

  if (!recharts) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <p className="text-xs text-muted-foreground">Loading interactive chart...</p>
      </div>
    )
  }

  const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = recharts

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={symptomCorrelationData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--mf-border)" />
          <XAxis dataKey="name" stroke="var(--mf-text-muted)" fontSize={12} tickLine={false} />
          <YAxis stroke="var(--mf-text-muted)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
          <Legend verticalAlign="top" height={36} iconType="circle" />
          <Bar dataKey="Cramps" fill="#f43f5e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Fatigue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Bloating" fill="#eab308" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Headache" fill="#a855f7" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Mood" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

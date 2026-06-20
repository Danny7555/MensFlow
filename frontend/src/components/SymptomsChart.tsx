"use client"

import * as React from "react"
import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { useStore } from "../store/useStore"
import { cn } from "@/lib/utils"

const Area = React.lazy(() => import("recharts").then(m => ({ default: m.Area })))
const AreaChart = React.lazy(() => import("recharts").then(m => ({ default: m.AreaChart })))
const CartesianGrid = React.lazy(() => import("recharts").then(m => ({ default: m.CartesianGrid })))
const XAxis = React.lazy(() => import("recharts").then(m => ({ default: m.XAxis })))
const YAxis = React.lazy(() => import("recharts").then(m => ({ default: m.YAxis })))

const chartConfig7Days = {
  severity: {
    label: "Intensity",
    color: "var(--mf-accent)",
  },
} satisfies ChartConfig

const chartConfig6Months = {
  cramps: {
    label: "Cramps",
    color: "#00a59b", // dark teal
  },
  moodSwings: {
    label: "Mood Swings",
    color: "var(--mf-accent)", // pink
  },
  fatigue: {
    label: "Fatigue",
    color: "#6b7280", // gray
  },
} satisfies ChartConfig

const CHART_DOMAIN = [0, 10]

export function SymptomsChart() {
  const { logs } = useStore()
  const [viewMode, setViewMode] = useState<'7days' | '6months'>('6months')

  const logsByDate = React.useMemo(() => {
    const map = new Map<string, string[]>()
    logs.forEach(l => {
      map.set(l.date, l.symptoms)
    })
    return map
  }, [logs])

  const logsByMonth = React.useMemo(() => {
    const map = new Map<string, string[][]>()
    logs.forEach(l => {
      const parts = l.date.split('-')
      if (parts.length >= 2) {
        const key = `${parts[0]}-${String(parts[1]).padStart(2, '0')}`
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(l.symptoms)
      }
    })
    return map
  }, [logs])

  const dynamic7DaysData = React.useMemo(() => {
    const dataList = []
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayName = dayNames[d.getDay()]
      
      const daySymptoms = logsByDate.get(dateStr)
      const severity = daySymptoms ? Math.min(10, daySymptoms.length * 2) : 0
      dataList.push({ day: dayName, severity })
    }
    return dataList
  }, [logsByDate])

  const dynamic6MonthsData = React.useMemo(() => {
    const dataList = []
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const year = d.getFullYear()
      const monthIdx = d.getMonth()
      const monthLabel = monthNames[monthIdx]
      const monthKey = `${year}-${String(monthIdx + 1).padStart(2, '0')}`

      const monthSymptomsList = logsByMonth.get(monthKey) || []

      let cramps = 0
      let moodSwings = 0
      let fatigue = 0

      monthSymptomsList.forEach(symptoms => {
        symptoms.forEach(sym => {
          const s = sym.toLowerCase()
          if (/cramp/.test(s)) cramps++
          if (/mood|anxious|sad|irritable/.test(s)) moodSwings++
          if (/fatigue|sleep/.test(s)) fatigue++
        })
      })

      dataList.push({
        month: monthLabel,
        cramps: Math.min(10, cramps),
        moodSwings: Math.min(10, moodSwings),
        fatigue: Math.min(10, fatigue)
      })
    }
    return dataList
  }, [logsByMonth])

  return (
    <Card className="border-none ring-0 bg-transparent">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Symptom Correlations</CardTitle>
            <CardDescription>
              {viewMode === '7days' ? 'Intensity over the last 7 days' : 'Intensity trends over the past 6 months'}
            </CardDescription>
          </div>
          <div className="flex items-center bg-muted/40 p-1 rounded-lg border border-border/50">
            <button
              type="button"
              onClick={() => setViewMode('7days')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                viewMode === '7days' ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => setViewMode('6months')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                viewMode === '6months' ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              6 Months
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 pb-0">
        <ChartContainer
          config={viewMode === '7days' ? chartConfig7Days : chartConfig6Months}
          className="h-[320px] w-full"
        >
          <React.Suspense fallback={<div className="h-full w-full bg-muted/5 animate-pulse rounded-xl" />}>
            <AreaChart
              accessibilityLayer
              data={viewMode === '7days' ? dynamic7DaysData : dynamic6MonthsData}
              margin={{
                top: 10,
                left: -20,
                right: 12,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id="fillSeverity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--mf-accent)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--mf-accent)" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="fillCramps" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00a59b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00a59b" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="fillMood" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--mf-accent)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--mf-accent)" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="fillFatigue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6b7280" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6b7280" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--mf-border)" />
              <XAxis
                dataKey={viewMode === '7days' ? "day" : "month"}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 3)}
                className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={CHART_DOMAIN}
                className="text-[10px] text-muted-foreground"
              />
              <ChartTooltip
                cursor={{ stroke: 'var(--mf-muted)', strokeWidth: 1, strokeDasharray: '4 4' }}
                content={<ChartTooltipContent indicator="line" />}
              />

              {viewMode === '7days' ? (
                <Area
                  dataKey="severity"
                  type="natural"
                  fill="url(#fillSeverity)"
                  fillOpacity={1}
                  stroke="var(--mf-accent)"
                  strokeWidth={2}
                />
              ) : (
                <>
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area
                    dataKey="fatigue"
                    type="natural"
                    fill="url(#fillFatigue)"
                    fillOpacity={1}
                    stroke="#6b7280"
                    strokeWidth={2}
                    stackId="a"
                  />
                  <Area
                    dataKey="moodSwings"
                    type="natural"
                    fill="url(#fillMood)"
                    fillOpacity={1}
                    stroke="var(--mf-accent)"
                    strokeWidth={2}
                    stackId="a"
                  />
                  <Area
                    dataKey="cramps"
                    type="natural"
                    fill="url(#fillCramps)"
                    fillOpacity={1}
                    stroke="#00a59b"
                    strokeWidth={2}
                    stackId="a"
                  />
                </>
              )}
            </AreaChart>
          </React.Suspense>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

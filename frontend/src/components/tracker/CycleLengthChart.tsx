"use client"

import * as React from "react"
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
} from "@/components/ui/chart"
import { useStore } from "@/store/useStore"
import { differenceInDays, parseISO, format } from "date-fns"
import { Calendar } from "@phosphor-icons/react"

const Bar = React.lazy(() => import("recharts").then(m => ({ default: m.Bar })))
const BarChart = React.lazy(() => import("recharts").then(m => ({ default: m.BarChart })))
const CartesianGrid = React.lazy(() => import("recharts").then(m => ({ default: m.CartesianGrid })))
const XAxis = React.lazy(() => import("recharts").then(m => ({ default: m.XAxis })))
const YAxis = React.lazy(() => import("recharts").then(m => ({ default: m.YAxis })))
const ReferenceLine = React.lazy(() => import("recharts").then(m => ({ default: m.ReferenceLine })))

const chartConfig = {
  length: {
    label: "Cycle Length",
    color: "var(--mf-accent)",
  },
  average: {
    label: "Average",
    color: "var(--mf-text-strong)",
  }
} satisfies ChartConfig

const CHART_DOMAIN = [15, 45]
const BAR_RADIUS: [number, number, number, number] = [6, 6, 0, 0]

export function CycleLengthChart() {
  const { logs, dashboard } = useStore()

  const chartData = React.useMemo(() => {
    if (!logs || logs.length === 0) return []

    // Group flow logs into periods to count cycle lengths
    const flowDates = logs
      .flatMap(l => l.symptoms.some(s => s.startsWith('flow-')) ? [l.date] : [])
      .sort()

    const starts: Date[] = []
    let prevDate: Date | null = null
    for (const dateStr of flowDates) {
      const d = parseISO(dateStr)
      if (!prevDate || differenceInDays(d, prevDate) > 4) {
        starts.push(d)
      }
      prevDate = d
    }

    const lengths: { month: string; length: number }[] = []
    for (let i = 0; i < starts.length - 1; i++) {
      const len = differenceInDays(starts[i + 1], starts[i])
      lengths.push({
        month: format(starts[i], 'MMM'),
        length: len
      })
    }

    const typicalCycleDays = dashboard.typicalCycleDays || 28
    const averageLength = lengths.length > 0
      ? Math.round(lengths.reduce((sum, item) => sum + item.length, 0) / lengths.length)
      : typicalCycleDays

    return lengths.map(item => ({
      ...item,
      average: averageLength
    })).slice(-6)
  }, [logs, dashboard.typicalCycleDays])

  const typicalCycleDays = dashboard.typicalCycleDays || 28
  const averageLineValue = chartData.length > 0 ? chartData[chartData.length - 1].average : typicalCycleDays

  return (
    <Card className="border-none shadow-none ring-0 bg-transparent">
      <CardHeader className="p-4 pb-2">
        <CardTitle>Cycle Length Variation</CardTitle>
        <CardDescription>
          Your cycle length over the past 6 months
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 pb-0">
        {chartData.length === 0 ? (
          <div className="h-[280px] w-full flex flex-col items-center justify-center border border-dashed border-[var(--mf-border)] rounded-2xl p-6 bg-card/20 text-center animate-in fade-in duration-300">
            <div className="size-12 rounded-2xl bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] flex items-center justify-center mb-4">
              <Calendar size={24} weight="duotone" />
            </div>
            <h4 className="text-sm font-semibold text-[var(--mf-text-strong)] mb-1">Not Enough Cycle History</h4>
            <p className="text-xs text-[var(--mf-muted)] max-w-xs leading-relaxed">
              Log your period starts on the tracker calendar over multiple months to calculate and display your cycle length variation trend.
            </p>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="h-[320px] w-full"
          >
            <React.Suspense fallback={<div className="h-full w-full bg-muted/5 animate-pulse rounded-xl" />}>
              <BarChart
                accessibilityLayer
                data={chartData}
                margin={{
                  top: 10,
                  left: -20,
                  right: 12,
                  bottom: 0,
                }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--mf-border)" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
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
                  cursor={{ fill: 'var(--mf-muted)', opacity: 0.2 }}
                  content={<ChartTooltipContent />}
                />
                <ReferenceLine y={averageLineValue} stroke="var(--mf-border)" strokeDasharray="4 4" strokeWidth={2} />
                <Bar
                  dataKey="length"
                  fill="var(--mf-accent)"
                  radius={BAR_RADIUS}
                  barSize={40}
                />
              </BarChart>
            </React.Suspense>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

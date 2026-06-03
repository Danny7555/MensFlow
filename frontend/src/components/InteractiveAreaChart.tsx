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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useStore } from "@/store/useStore"
import { subDays, format } from "date-fns"

const Area = React.lazy(() => import("recharts").then(m => ({ default: m.Area })))
const AreaChart = React.lazy(() => import("recharts").then(m => ({ default: m.AreaChart })))
const CartesianGrid = React.lazy(() => import("recharts").then(m => ({ default: m.CartesianGrid })))
const XAxis = React.lazy(() => import("recharts").then(m => ({ default: m.XAxis })))

const chartConfig = {
  energy: {
    label: "Energy",
    color: "var(--mf-accent)",
  },
  bloating: {
    label: "Bloating",
    color: "var(--mf-muted)",
  },
} satisfies ChartConfig

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function parseAndFormatDate(dateStr: string) {
  const parts = dateStr.split("-")
  if (parts.length !== 3) return dateStr
  const monthIdx = parseInt(parts[1], 10) - 1
  const day = parseInt(parts[2], 10)
  if (monthIdx >= 0 && monthIdx < 12) {
    return `${MONTH_NAMES[monthIdx]} ${day}`
  }
  return dateStr
}

interface ChartDataItem {
  date: string
  energy: number
  bloating: number
}

export function InteractiveAreaChart() {
  const [timeRange, setTimeRange] = React.useState("90d")
  const { logs, dashboard } = useStore()

  const dynamicChartData = React.useMemo(() => {
    let daysCount = 90
    if (timeRange === "30d") {
      daysCount = 30
    } else if (timeRange === "7d") {
      daysCount = 7
    }

    // Reference cycle start date and typical days
    // eslint-disable-next-line react-hooks/purity
    const fallbackTime = Date.now() - 28 * 24 * 60 * 60 * 1000
    // eslint-disable-next-line react-hooks/purity
    const fallbackDate = new Date(fallbackTime)
    const refStart = dashboard.lastPeriodStart
      ? new Date(dashboard.lastPeriodStart)
      : fallbackDate
    const typicalCycleDays = dashboard.typicalCycleDays || 28

    const data: ChartDataItem[] = []
    // eslint-disable-next-line react-hooks/purity
    const today = new Date()

    const logsMap = new Map(logs.map((l) => [l.date, l]))

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = subDays(today, i)
      const dateKey = format(d, 'yyyy-MM-dd')
      const log = logsMap.get(dateKey)

      // Calculate cycle day relative to refStart
      const diffTime = d.getTime() - refStart.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      const cycleDay = ((diffDays % typicalCycleDays) + typicalCycleDays) % typicalCycleDays

      let energy: number
      let bloating: number

      if (log) {
        // Log exists: map actual symptoms
        // Energy baseline = 60
        const symptomsSet = new Set(log.symptoms)
        let tempEnergy = 60
        if (symptomsSet.has('mood-happy')) tempEnergy += 25
        if (symptomsSet.has('mood-calm')) tempEnergy += 15
        if (symptomsSet.has('phys-fatigue')) tempEnergy -= 30
        if (symptomsSet.has('mood-sad')) tempEnergy -= 20
        if (symptomsSet.has('mood-irritable')) tempEnergy -= 15
        
        // Bloating baseline = 20
        let tempBloating = 20
        if (symptomsSet.has('phys-bloating')) tempBloating += 50
        if (symptomsSet.has('phys-cramps')) tempBloating += 30
        if (symptomsSet.has('flow-heavy')) tempBloating += 20
        if (symptomsSet.has('flow-medium')) tempBloating += 10

        energy = Math.max(10, Math.min(100, tempEnergy))
        bloating = Math.max(10, Math.min(100, tempBloating))
      } else {
        // No log: fallback to cycle simulation curve (peaking / dropping based on hormones)
        // Energy peaks around ovulation (day 12-16), drops during pre-menstrual/menstrual phases
        const energyAngle = ((cycleDay - (0.45 * typicalCycleDays)) / typicalCycleDays) * 2 * Math.PI
        const simEnergy = Math.round(60 + 25 * Math.cos(energyAngle))

        // Bloating peaks right before / during menstruation (days 26-28, 1-3)
        const bloatingAngle = ((cycleDay - (0.05 * typicalCycleDays)) / typicalCycleDays) * 2 * Math.PI
        const simBloating = Math.round(35 + 20 * Math.cos(bloatingAngle))

        energy = Math.max(10, Math.min(100, simEnergy))
        bloating = Math.max(10, Math.min(100, simBloating))
      }

      data.push({
        date: dateKey,
        energy,
        bloating,
      })
    }

    return data
  }, [logs, timeRange, dashboard.lastPeriodStart, dashboard.typicalCycleDays])

  const formatDate = React.useCallback((value: string) => {
    return parseAndFormatDate(value)
  }, [])

  return (
    <Card className="border-none shadow-none ring-0 bg-transparent">
      <CardHeader className="flex flex-col items-start gap-4 gap-y-0 border-b py-5 sm:flex-row sm:items-center">
        <div className="grid flex-1 gap-1 text-left">
          <CardTitle className="font-normal text-sm sm:text-base">Health Metrics Over Time</CardTitle>
          <CardDescription suppressHydrationWarning>
            Showing data for the last {timeRange === "90d" ? "3 months" : timeRange === "30d" ? "30 days" : "7 days"}
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-[160px] rounded-lg sm:ml-auto"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Last 3 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">
              Last 3 months
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Last 30 days
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Last 7 days
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
          suppressHydrationWarning
        >
          <React.Suspense fallback={<div className="h-full w-full bg-muted/5 animate-pulse" />}>
            <AreaChart data={dynamicChartData}>
              <defs>
                <linearGradient id="fillEnergy" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-energy)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-energy)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillBloating" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-bloating)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-bloating)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={formatDate}
                suppressHydrationWarning
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => formatDate(value as string)}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="bloating"
                type="natural"
                fill="url(#fillBloating)"
                stroke="var(--color-bloating)"
                stackId="a"
              />
              <Area
                dataKey="energy"
                type="natural"
                fill="url(#fillEnergy)"
                stroke="var(--color-energy)"
                stackId="a"
              />
            </AreaChart>
          </React.Suspense>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

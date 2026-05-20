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

const Area = React.lazy(() => import("recharts").then(m => ({ default: m.Area })))
const AreaChart = React.lazy(() => import("recharts").then(m => ({ default: m.AreaChart })))
const CartesianGrid = React.lazy(() => import("recharts").then(m => ({ default: m.CartesianGrid })))
const XAxis = React.lazy(() => import("recharts").then(m => ({ default: m.XAxis })))

const chartData = [
  { date: "2024-04-01", energy: 222, bloating: 150 },
  { date: "2024-04-02", energy: 97, bloating: 180 },
  { date: "2024-04-03", energy: 167, bloating: 120 },
  { date: "2024-04-04", energy: 242, bloating: 260 },
  { date: "2024-04-05", energy: 373, bloating: 290 },
  { date: "2024-04-06", energy: 301, bloating: 340 },
  { date: "2024-04-07", energy: 245, bloating: 180 },
  { date: "2024-04-08", energy: 409, bloating: 320 },
  { date: "2024-04-09", energy: 59, bloating: 110 },
  { date: "2024-04-10", energy: 261, bloating: 190 },
  { date: "2024-04-11", energy: 327, bloating: 350 },
  { date: "2024-04-12", energy: 292, bloating: 210 },
  { date: "2024-04-13", energy: 342, bloating: 380 },
  { date: "2024-04-14", energy: 137, bloating: 220 },
  { date: "2024-04-15", energy: 120, bloating: 170 },
  { date: "2024-04-16", energy: 138, bloating: 190 },
  { date: "2024-04-17", energy: 446, bloating: 360 },
  { date: "2024-04-18", energy: 364, bloating: 410 },
  { date: "2024-04-19", energy: 243, bloating: 180 },
  { date: "2024-04-20", energy: 89, bloating: 150 },
  { date: "2024-04-21", energy: 137, bloating: 200 },
  { date: "2024-04-22", energy: 224, bloating: 170 },
  { date: "2024-04-23", energy: 138, bloating: 230 },
  { date: "2024-04-24", energy: 387, bloating: 290 },
  { date: "2024-04-25", energy: 215, bloating: 250 },
  { date: "2024-04-26", energy: 75, bloating: 130 },
  { date: "2024-04-27", energy: 383, bloating: 420 },
  { date: "2024-04-28", energy: 122, bloating: 180 },
  { date: "2024-04-29", energy: 315, bloating: 240 },
  { date: "2024-04-30", energy: 454, bloating: 380 },
  { date: "2024-05-01", energy: 165, bloating: 220 },
  { date: "2024-05-02", energy: 293, bloating: 310 },
  { date: "2024-05-03", energy: 247, bloating: 190 },
  { date: "2024-05-04", energy: 385, bloating: 420 },
  { date: "2024-05-05", energy: 481, bloating: 390 },
  { date: "2024-05-06", energy: 498, bloating: 520 },
  { date: "2024-05-07", energy: 388, bloating: 300 },
  { date: "2024-05-08", energy: 149, bloating: 210 },
  { date: "2024-05-09", energy: 227, bloating: 180 },
  { date: "2024-05-10", energy: 293, bloating: 330 },
  { date: "2024-05-11", energy: 335, bloating: 270 },
  { date: "2024-05-12", energy: 197, bloating: 240 },
  { date: "2024-05-13", energy: 197, bloating: 160 },
  { date: "2024-05-14", energy: 448, bloating: 490 },
  { date: "2024-05-15", energy: 473, bloating: 380 },
  { date: "2024-05-16", energy: 338, bloating: 400 },
  { date: "2024-05-17", energy: 499, bloating: 420 },
  { date: "2024-05-18", energy: 315, bloating: 350 },
  { date: "2024-05-19", energy: 235, bloating: 180 },
  { date: "2024-05-20", energy: 285, bloating: 310 },
  { date: "2024-05-21", energy: 503, bloating: 440 },
  { date: "2024-05-22", energy: 371, bloating: 310 },
  { date: "2024-05-23", energy: 482, bloating: 520 },
  { date: "2024-05-24", energy: 470, bloating: 390 },
  { date: "2024-05-25", energy: 112, bloating: 180 },
  { date: "2024-05-26", energy: 472, bloating: 510 },
  { date: "2024-05-27", energy: 432, bloating: 380 },
  { date: "2024-05-28", energy: 313, bloating: 350 },
  { date: "2024-05-29", energy: 159, bloating: 240 },
  { date: "2024-05-30", energy: 326, bloating: 380 },
  { date: "2024-05-31", energy: 442, bloating: 420 },
  { date: "2024-06-01", energy: 120, bloating: 170 },
  { date: "2024-06-02", energy: 138, bloating: 190 },
  { date: "2024-06-03", energy: 446, bloating: 360 },
  { date: "2024-06-04", energy: 364, bloating: 410 },
  { date: "2024-06-05", energy: 243, bloating: 180 },
  { date: "2024-06-06", energy: 89, bloating: 150 },
  { date: "2024-06-07", energy: 137, bloating: 200 },
  { date: "2024-06-08", energy: 224, bloating: 170 },
  { date: "2024-06-09", energy: 138, bloating: 230 },
  { date: "2024-06-10", energy: 387, bloating: 290 },
  { date: "2024-06-11", energy: 215, bloating: 250 },
  { date: "2024-06-12", energy: 75, bloating: 130 },
  { date: "2024-06-13", energy: 383, bloating: 420 },
  { date: "2024-06-14", energy: 122, bloating: 180 },
  { date: "2024-06-15", energy: 315, bloating: 240 },
  { date: "2024-06-16", energy: 454, bloating: 380 },
  { date: "2024-06-17", energy: 165, bloating: 220 },
  { date: "2024-06-18", energy: 293, bloating: 310 },
  { date: "2024-06-19", energy: 247, bloating: 190 },
  { date: "2024-06-20", energy: 385, bloating: 420 },
  { date: "2024-06-21", energy: 481, bloating: 390 },
  { date: "2024-06-22", energy: 498, bloating: 520 },
  { date: "2024-06-23", energy: 388, bloating: 300 },
  { date: "2024-06-24", energy: 149, bloating: 210 },
  { date: "2024-06-25", energy: 227, bloating: 180 },
  { date: "2024-06-26", energy: 293, bloating: 330 },
  { date: "2024-06-27", energy: 335, bloating: 270 },
  { date: "2024-06-28", energy: 197, bloating: 240 },
  { date: "2024-06-29", energy: 197, bloating: 160 },
  { date: "2024-06-30", energy: 448, bloating: 490 },
]

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

/* eslint-disable react-hooks/set-state-in-effect */
export function InteractiveAreaChart() {
  const [timeRange, setTimeRange] = React.useState("90d")

  const filteredData = React.useMemo(() => {
    return chartData.filter((item) => {
      const parts = item.date.split("-")
      const dateVal = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
      const nowVal = new Date(2024, 5, 30) // index 5 is June
      let daysToSubtract = 90
      if (timeRange === "30d") {
        daysToSubtract = 30
      } else if (timeRange === "7d") {
        daysToSubtract = 7
      }
      const startVal = new Date(nowVal)
      startVal.setDate(startVal.getDate() - daysToSubtract)
      return dateVal >= startVal
    })
  }, [timeRange])

  const formatDate = React.useCallback((value: string) => {
    return parseAndFormatDate(value)
  }, [])

  return (
    <Card className="border-none shadow-none ring-0 bg-transparent">
      <CardHeader className="flex flex-col items-start gap-4 gap-y-0 border-b py-5 sm:flex-row sm:items-center">
        <div className="grid flex-1 gap-1 text-left">
          <CardTitle>Health Metrics Over Time</CardTitle>
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
            <AreaChart data={filteredData}>
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

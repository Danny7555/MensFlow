"use client"

import * as React from "react"
import { Question } from "@phosphor-icons/react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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

const Area = React.lazy(() => import("recharts").then(m => ({ default: m.Area })))
const AreaChart = React.lazy(() => import("recharts").then(m => ({ default: m.AreaChart })))
const CartesianGrid = React.lazy(() => import("recharts").then(m => ({ default: m.CartesianGrid })))
const XAxis = React.lazy(() => import("recharts").then(m => ({ default: m.XAxis })))
const YAxis = React.lazy(() => import("recharts").then(m => ({ default: m.YAxis })))

import { useStore } from "@/store/useStore"
import { subDays, format } from "date-fns"

const chartConfig = {
  intensity: {
    label: "Intensity",
    color: "var(--mf-accent)",
  },
} satisfies ChartConfig

export function SymptomTrendsChart() {
  const { logs } = useStore()

  const chartData = React.useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(new Date(), i)
      const dateKey = format(d, 'yyyy-MM-dd')
      const log = logs.find(l => l.date === dateKey)
      return {
        day: format(d, 'EEEE'),
        intensity: log ? log.symptoms.length : 0
      }
    }).reverse()
  }, [logs])
  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle>Symptom Trends</CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-1 hover:bg-black/5 rounded-full transition-colors inline-flex items-center justify-center cursor-help" aria-label="About symptom trends">
                <Question size={14} weight="bold" className="opacity-60" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="max-w-[200px]">
                Trends show the intensity of your symptoms over the last 7 days based on your daily logs.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <CardDescription>
          Intensity over the last 7 days
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 pb-0">
        <ChartContainer config={chartConfig} className="h-[320px] w-full">
          <React.Suspense fallback={<div className="h-full w-full bg-muted/5 animate-pulse" />}>
            <AreaChart
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
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 3)}
                className="text-[10px] text-muted-foreground"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={[0, 10]}
                className="text-[10px] text-muted-foreground"
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <defs>
                <linearGradient id="fillIntensity" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--mf-accent)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--mf-accent)"
                    stopOpacity={0.01}
                  />
                </linearGradient>
              </defs>
              <Area
                dataKey="intensity"
                type="natural"
                fill="url(#fillIntensity)"
                fillOpacity={1}
                stroke="var(--mf-accent)"
                strokeWidth={2}
                stackId="a"
              />
            </AreaChart>
          </React.Suspense>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

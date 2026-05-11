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
import { SYMPTOM_HISTORY_DUMMY } from "../data/symptomsData"

const Area = React.lazy(() => import("recharts").then(m => ({ default: m.Area })))
const AreaChart = React.lazy(() => import("recharts").then(m => ({ default: m.AreaChart })))
const CartesianGrid = React.lazy(() => import("recharts").then(m => ({ default: m.CartesianGrid })))
const XAxis = React.lazy(() => import("recharts").then(m => ({ default: m.XAxis })))
const YAxis = React.lazy(() => import("recharts").then(m => ({ default: m.YAxis })))

const chartConfig = {
  severity: {
    label: "Intensity",
    color: "var(--mf-accent)",
  },
} satisfies ChartConfig

export function SymptomsChart() {
  return (
    <Card className="border-none shadow-none ring-0 bg-transparent">
      <CardHeader className="p-4 pb-2">
        <CardTitle>Symptom Trends</CardTitle>
        <CardDescription>
          Intensity over the last 7 days
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 pb-0">
        <ChartContainer
          config={chartConfig}
          className="h-[320px] w-full"
        >
          <React.Suspense fallback={<div className="h-full w-full bg-muted/5 animate-pulse" />}>
            <AreaChart
              accessibilityLayer
              data={SYMPTOM_HISTORY_DUMMY}
              margin={{
                top: 10,
                left: -20,
                right: 12,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id="fillSeverity" x1="0" y1="0" x2="0" y2="1">
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
              <Area
                dataKey="severity"
                type="natural"
                fill="url(#fillSeverity)"
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

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
import { CYCLE_LENGTH_HISTORY_6M } from "@/data/symptomsData"

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

export function CycleLengthChart() {
  return (
    <Card className="border-none shadow-none ring-0 bg-transparent">
      <CardHeader className="p-4 pb-2">
        <CardTitle>Cycle Length Variation</CardTitle>
        <CardDescription>
          Your cycle length over the past 6 months
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 pb-0">
        <ChartContainer
          config={chartConfig}
          className="h-[320px] w-full"
        >
          <React.Suspense fallback={<div className="h-full w-full bg-muted/5 animate-pulse rounded-xl" />}>
            <BarChart
              accessibilityLayer
              data={CYCLE_LENGTH_HISTORY_6M}
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
                domain={[20, 35]}
                className="text-[10px] text-muted-foreground"
              />
              <ChartTooltip
                cursor={{ fill: 'var(--mf-muted)', opacity: 0.2 }}
                content={<ChartTooltipContent />}
              />
              <ReferenceLine y={29} stroke="var(--mf-border)" strokeDasharray="4 4" strokeWidth={2} />
              <Bar
                dataKey="length"
                fill="var(--mf-accent)"
                radius={[6, 6, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </React.Suspense>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

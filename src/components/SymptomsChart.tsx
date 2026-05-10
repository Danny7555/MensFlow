"use client"


import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

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

const chartConfig = {
  severity: {
    label: "Symptom Intensity",
    color: "var(--mf-accent)",
  },
} satisfies ChartConfig

export function SymptomsChart() {
  return (
    <Card className="border-none shadow-none ring-0 bg-transparent">
      <CardHeader className="flex flex-col items-start gap-4 gap-y-0 border-b pb-4 mb-4 sm:flex-row sm:items-center">
        <div className="grid flex-1 gap-1 text-left">
          <CardTitle>Symptom Trends</CardTitle>
          <CardDescription>
            Intensity over the last 7 days
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-4">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[220px] w-full"
        >
          <AreaChart
            data={SYMPTOM_HISTORY_DUMMY}
            margin={{
              left: -10,
              right: 12,
              top: 10,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="fillSeverity" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-severity)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-severity)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  hideLabel={false}
                />
              }
            />
            <Area
              dataKey="severity"
              type="monotone"
              fill="url(#fillSeverity)"
              fillOpacity={0.4}
              stroke="var(--color-severity)"
              strokeWidth={3}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

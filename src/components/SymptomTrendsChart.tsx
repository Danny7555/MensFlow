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

const chartData = [
  { day: "Monday", intensity: 4 },
  { day: "Tuesday", intensity: 3 },
  { day: "Wednesday", intensity: 5 },
  { day: "Thursday", intensity: 2 },
  { day: "Friday", intensity: 6 },
  { day: "Saturday", intensity: 7 },
  { day: "Sunday", intensity: 5 },
]

const chartConfig = {
  intensity: {
    label: "Intensity",
    color: "var(--mf-accent)",
  },
} satisfies ChartConfig

export function SymptomTrendsChart() {
  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="p-4 pb-2">
        <CardTitle>Symptom Trends</CardTitle>
        <CardDescription>
          Intensity over the last 7 days
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 pb-0">
        <ChartContainer config={chartConfig} className="h-[320px] w-full">
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
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

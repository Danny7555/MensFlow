import * as React from "react"
<<<<<<< HEAD

// Type for chart payload items
interface ChartPayloadItem {
  type?: string
  name?: string | number
  dataKey?: string | number
  value?: string | number
  fill?: string
  color?: string
  payload?: Record<string, unknown>
  [key: string]: unknown
}

const ResponsiveContainer = React.lazy(() => import("recharts").then(m => ({ default: m.ResponsiveContainer })))
const Tooltip = React.lazy(() => import("recharts").then(m => ({ default: m.Tooltip })))
const Legend = React.lazy(() => import("recharts").then(m => ({ default: m.Legend })))
=======
import * as RechartsPrimitive from "recharts"
import type {
  ValueType as TooltipValueType,
  NameType as TooltipNameType,
} from "recharts/types/component/DefaultTooltipContent"
>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)

import { cn } from "@/lib/utils"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: "[data-theme='dark']" } as const

const INITIAL_DIMENSION = { width: 320, height: 200 } as const

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
>

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.use(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

function ChartContainer({
  id,
  className,
  children,
  config,
  initialDimension = INITIAL_DIMENSION,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig
  children: React.ReactNode
  initialDimension?: {
    width: number
    height: number
  }
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <React.Suspense fallback={<div className="h-full w-full bg-muted/5 animate-pulse" />}>
          <ResponsiveContainer
            initialDimension={initialDimension}
          >
            {children}
          </ResponsiveContainer>
        </React.Suspense>
      </div>
    </ChartContext.Provider>
  )
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = React.useMemo(() => 
    Object.entries(config).filter(([, config]) => config.theme ?? config.color),
    [config]
  )

  React.useLayoutEffect(() => {
    if (!colorConfig.length) return

    const css = Object.entries(THEMES)
      .map(
        ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ??
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join("\n")}
}
`
      )
      .join("\n")

    const style = document.createElement("style")
    style.id = `style-${id}`
    style.textContent = css
    document.head.appendChild(style)
    return () => {
      style.remove()
    }
  }, [id, colorConfig])

  return null
}

const ChartTooltip = Tooltip

const ChartTooltipLabel = React.memo(({
  config,
  hideLabel,
  payload,
  label,
  labelKey,
  labelClassName,
  labelFormatter,
}: {
  config: ChartConfig
  hideLabel: boolean
  payload: readonly unknown[]
  label: React.ReactNode
  labelKey?: string
  labelClassName?: string
  labelFormatter?: (value: unknown, payload: readonly unknown[]) => React.ReactNode
}) => {
  if (hideLabel) {
    return null
  }

  const item = (payload as ChartPayloadItem[] | undefined)?.[0]
  const key = `${labelKey ?? item?.dataKey ?? item?.name ?? "value"}`
  const itemConfig = getPayloadConfigFromPayload(config, item, key)
  const value =
    !labelKey && typeof label === "string"
      ? (config[label]?.label ?? label)
      : itemConfig?.label

  if (labelFormatter) {
    return (
      <div className={cn("font-medium", labelClassName)}>
        {labelFormatter(value, payload ?? [])}
      </div>
    )
  }

  if (!value) {
    return null
  }

  return (
    <div className={cn("font-medium", labelClassName)}>{value}</div>
  )
})

const ChartTooltipLabel = React.memo(({
  config,
  hideLabel,
  payload,
  label,
  labelKey,
  labelClassName,
  labelFormatter,
}: {
  config: ChartConfig
  hideLabel: boolean
  payload: readonly any[]
  label: React.ReactNode
  labelKey?: string
  labelClassName?: string
  labelFormatter?: (value: any, payload: readonly any[]) => React.ReactNode
}) => {
  if (hideLabel) {
    return null
  }

  const item = payload?.[0]
  const key = `${labelKey ?? item?.dataKey ?? item?.name ?? "value"}`
  const itemConfig = getPayloadConfigFromPayload(config, item, key)
  const value =
    !labelKey && typeof label === "string"
      ? (config[label]?.label ?? label)
      : itemConfig?.label

  if (labelFormatter) {
    return (
      <div className={cn("font-medium", labelClassName)}>
        {labelFormatter(value, payload ?? [])}
      </div>
    )
  }

  if (!value) {
    return null
  }

  return (
    <div className={cn("font-medium", labelClassName)}>{value}</div>
  )
})

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}: {
  active?: boolean
  payload?: readonly unknown[]
  className?: string
  indicator?: "line" | "dot" | "dashed"
  hideLabel?: boolean
  hideIndicator?: boolean
  label?: React.ReactNode
  labelFormatter?: (value: unknown, payload: readonly unknown[]) => React.ReactNode
  labelClassName?: string
  formatter?: (value: unknown, name: unknown, item: unknown, index: number, payload: unknown) => React.ReactNode
  color?: string
  nameKey?: string
  labelKey?: string
} & React.ComponentProps<"div">) {
  const { config } = useChart()

<<<<<<< HEAD
  if (!active || !Array.isArray(payload) || !payload.length) {
=======
  if (!active || !payload?.length) {
>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)
    return null
  }

  const nestLabel = (payload as ChartPayloadItem[]).length === 1 && indicator !== "dot"

  return (
    <div
      className={cn(
        "grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs",
        className
      )}
      suppressHydrationWarning
    >
      {!nestLabel ? (
        <ChartTooltipLabel
          config={config}
          hideLabel={hideLabel}
          payload={payload}
          label={label}
          labelKey={labelKey}
          labelClassName={labelClassName}
          labelFormatter={labelFormatter}
        />
      ) : null}
      <div className="grid gap-1.5">
<<<<<<< HEAD
        {(payload as ChartPayloadItem[]).reduce<React.ReactNode[]>((acc, item: ChartPayloadItem, index) => {
=======
        {payload.reduce<React.ReactNode[]>((acc, item, index) => {
>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)
          if (item.type === "none") return acc
          const key = `${nameKey ?? item.name ?? item.dataKey ?? "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)
          const indicatorColor = color ?? item.payload?.fill ?? item.color

          acc.push(
            <div
              key={key}
              className={cn(
                "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                indicator === "dot" && "items-center"
              )}
            >
              {formatter && item?.value !== undefined && item.name ? (
                formatter(item.value, item.name, item, index, item.payload)
              ) : (
                <>
                  {itemConfig?.icon ? (
                    <itemConfig.icon />
                  ) : (
                    !hideIndicator && (
                      <div
                        className={cn(
                          "shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)",
                          {
                            "h-2.5 w-2.5": indicator === "dot",
                            "w-1": indicator === "line",
                            "w-0 border-[1.5px] border-dashed bg-transparent":
                              indicator === "dashed",
                            "my-0.5": nestLabel && indicator === "dashed",
                          }
                        )}
                        style={
                          {
                            "--color-bg": indicatorColor,
                            "--color-border": indicatorColor,
                          } as React.CSSProperties
                        }
                      />
                    )
                  )}
                  <div
                    className={cn(
                      "flex flex-1 justify-between leading-none",
                      nestLabel ? "items-end" : "items-center"
                    )}
                  >
                    <div className="grid gap-1.5">
                      {nestLabel ? (
                        <ChartTooltipLabel
                          config={config}
                          hideLabel={hideLabel}
                          payload={payload}
                          label={label}
                          labelKey={labelKey}
                          labelClassName={labelClassName}
                          labelFormatter={labelFormatter}
                        />
                      ) : null}
                      <span className="text-muted-foreground">
                        {itemConfig?.label ?? item.name}
                      </span>
                    </div>
                    {item.value != null && (
                      <span className="font-mono font-medium text-foreground tabular-nums">
                        {typeof item.value === "number"
                          ? item.value.toLocaleString()
                          : String(item.value)}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          )
          return acc
        }, [])}
      </div>
    </div>
  )
}

const ChartLegend = Legend

function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = "bottom",
  nameKey,
}: React.ComponentProps<"div"> & {
  hideIcon?: boolean
  nameKey?: string
} & Record<string, unknown>) {
  const { config } = useChart()

  if (!Array.isArray(payload) || !payload.length) {
    return null
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className
      )}
    >
<<<<<<< HEAD
      {(payload as ChartPayloadItem[]).reduce<React.ReactNode[]>((acc, item: ChartPayloadItem) => {
=======
      {payload.reduce<React.ReactNode[]>((acc, item) => {
>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)
        if (item.type === "none") return acc
        const key = `${nameKey ?? item.dataKey ?? "value"}`
        const itemConfig = getPayloadConfigFromPayload(config, item, key)

        acc.push(
          <div
            key={key}
            className={cn(
              "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
            )}
          >
            {itemConfig?.icon && !hideIcon ? (
              <itemConfig.icon />
            ) : (
              <div
                className="size-2 shrink-0 rounded-[2px]"
                style={{
                  backgroundColor: item.color,
                }}
              />
            )}
            {itemConfig?.label}
          </div>
        )
        return acc
      }, [])}
    </div>
  )
}

function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string
  }

  return configLabelKey in config ? config[configLabelKey] : config[key]
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}

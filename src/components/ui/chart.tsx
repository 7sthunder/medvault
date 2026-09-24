"use client"

import type { ChartDatum } from "./chart-types"
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { cn } from "cn"
import { TrendingUp } from "lucide-react"

import { EmptyState } from "@/components/ui/empty-state"
import {
  CHART_AXIS,
  CHART_FONT_FAMILY,
  CHART_GRID,
  chartColor,
  type ChartSeries,
} from "@/lib/chart-theme"

interface TooltipRow {
  name?: string | number
  value?: number | string
  color?: string
}

interface ChartTooltipProps {
  active?: boolean
  label?: string | number
  payload?: TooltipRow[]
  formatValue: (value: number | string) => string
}

/** Glass tooltip (plan §5.4) — matched §2 popover surface, theme-aware. */
function ChartTooltip({ active, label, payload, formatValue }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card/95 p-2.5 shadow-card backdrop-blur-md">
      {label != null && <p className="mb-1.5 text-xs font-semibold text-ink-900">{label}</p>}
      <ul className="grid gap-1">
        {payload.map((row, index) => (
          <li
            key={`${row.name ?? index}`}
            className="flex items-center justify-between gap-4 text-xs text-ink-600"
          >
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: row.color }}
              />
              {row.name}
            </span>
            <span className="font-semibold text-ink-900">{formatValue(row.value ?? 0)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export interface TrendChartProps {
  kind?: "area" | "line" | "bar"
  data: readonly ChartDatum[]
  series: readonly ChartSeries[]
  /** Key on each datum used for the X category axis. */
  xKey: string
  height?: number
  /** Formats tooltip values + y-axis ticks (e.g. `(v) => `${v}%``). */
  formatValue?: (value: number | string) => string
  /** Compact the X labels (e.g. `MMM d` → `May 14` from a full key). */
  xTickFormatter?: (value: string | number) => string
  legend?: boolean
  emptyTitle?: string
  emptyDescription?: string
  className?: string
}

/**
 * Phase 08 chart wrapper — Recharts `ResponsiveContainer` + §5.3 palette +
 * glass tooltip. Renders a designed empty state instead of a blank canvas when
 * `data` is empty; never crashes on zero-length input.
 */
export function TrendChart({
  kind = "area",
  data,
  series,
  xKey,
  height = 240,
  formatValue = (v) => String(v),
  xTickFormatter,
  legend = false,
  emptyTitle = "No data in this range",
  emptyDescription = "Expand the date range or add medications to see trends here.",
  className,
}: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div
        data-slot="trend-chart-empty"
        className={cn(
          "flex min-h-40 items-center justify-center rounded-xl border border-dashed border-border bg-card/40 p-6",
          className,
        )}
      >
        <EmptyState compact icon={TrendingUp} title={emptyTitle} description={emptyDescription} />
      </div>
    )
  }

  return (
    <div
      data-slot="trend-chart"
      className={cn("w-full", className)}
      style={{ fontFamily: CHART_FONT_FAMILY }}
    >
      <ResponsiveContainer width="100%" height={height} debounce={50}>
        <ComposedChart data={[...data]} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid stroke={CHART_GRID} strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey={xKey}
            tickLine={false}
            axisLine={{ stroke: CHART_AXIS }}
            tick={{ fontSize: 11, fill: CHART_AXIS }}
            tickFormatter={(value) => (xTickFormatter ? xTickFormatter(value as string | number) : value)}
            minTickGap={24}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: CHART_AXIS }}
            tickFormatter={(value) => formatValue(Number(value))}
            width={46}
          />
          <Tooltip
            content={<ChartTooltip formatValue={formatValue} />}
            cursor={{ stroke: CHART_AXIS, strokeDasharray: "4 4" }}
          />
          {legend && (
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingTop: 4 }}
            />
          )}
          {series.map((s, index) => {
            const color = s.color ?? chartColor(index)
            if (kind === "line") {
              return (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              )
            }
            if (kind === "bar") {
              return (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.name}
                  fill={color}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              )
            }
            return (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={color}
                strokeWidth={2.5}
                fill={color}
                fillOpacity={0.12}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            )
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
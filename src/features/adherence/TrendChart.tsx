"use client";

import { useMemo } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { CHART_AXIS, CHART_FONT_FAMILY, CHART_GRID } from "@/lib/chart-theme";
import { formatDateKey } from "@/lib/format";
import type { TrendDTO } from "@/shared/types";

export interface TrendChartProps {
  trend: TrendDTO;
}

interface ChartItem {
  date: string;
  displayDate: string;
  adherence: number | null;
  rolling7: number | null;
}

export function TrendChart({ trend }: TrendChartProps) {
  const chartData = useMemo<ChartItem[]>(() => {
    const rollingMap = new Map(trend.rolling7.map((r) => [r.date, r.value]));

    return trend.daily.map((d) => {
      return {
        date: d.date,
        displayDate: formatDateKey(d.date, "short"),
        adherence: d.adherencePercent,
        rolling7: rollingMap.get(d.date) ?? null,
      };
    });
  }, [trend]);

  return (
    <Card className="p-5 space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3">
        <div>
          <h2 className="font-heading text-base font-semibold text-ink-900 dark:text-ink-100">
            Adherence Trend
          </h2>
          <p className="text-xs text-muted-foreground">
            Daily completion rate alongside 7-day rolling average.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 sm:pt-0">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-primary/70 shrink-0" />
            <span>Daily Adherence</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-primary shrink-0" />
            <span>7-Day Average</span>
          </div>
        </div>
      </div>

      <div className="h-72 w-full pt-2">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No adherence data available for this range.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={CHART_GRID}
                vertical={false}
              />
              <XAxis
                dataKey="displayDate"
                stroke={CHART_AXIS}
                fontSize={11}
                tickLine={false}
                fontFamily={CHART_FONT_FAMILY}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                stroke={CHART_AXIS}
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => `${val}%`}
                fontFamily={CHART_FONT_FAMILY}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0]?.payload as ChartItem;
                  return (
                    <div className="rounded-lg border border-border bg-card/95 p-2.5 shadow-card backdrop-blur-md text-xs space-y-1">
                      <p className="font-semibold text-ink-900 dark:text-ink-100">
                        {formatDateKey(item.date, "long")}
                      </p>
                      <div className="space-y-0.5 text-muted-foreground">
                        <p>
                          Daily:{" "}
                          <span className="font-semibold text-ink-800 dark:text-ink-200">
                            {item.adherence !== null ? `${item.adherence}%` : "No doses"}
                          </span>
                        </p>
                        {item.rolling7 !== null && (
                          <p>
                            7-Day Avg:{" "}
                            <span className="font-semibold text-primary">
                              {item.rolling7}%
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="adherence"
                fill="var(--primary)"
                opacity={0.65}
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
              <Line
                type="monotone"
                dataKey="rolling7"
                stroke="var(--primary)"
                strokeWidth={2.5}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

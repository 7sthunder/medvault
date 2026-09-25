"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3 } from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { CHART_AXIS, CHART_FONT_FAMILY, CHART_GRID } from "@/lib/chart-theme";
import { formatDateKey } from "@/lib/format";
import type { AdherenceDay } from "@/shared/types";

export interface AdherenceWidgetProps {
  week: AdherenceDay[];
}

interface ChartItem {
  date: string;
  displayDate: string;
  adherencePercent: number | null;
  scheduled: number;
  taken: number;
  missed: number;
}

export function AdherenceWidget({ week }: AdherenceWidgetProps) {
  const chartData = useMemo<ChartItem[]>(() => {
    return week.map((d) => ({
      date: d.date,
      displayDate: formatDateKey(d.date, "short"),
      adherencePercent: d.adherencePercent,
      scheduled: d.scheduled,
      taken: d.taken,
      missed: d.missed,
    }));
  }, [week]);

  return (
    <section
      data-testid="adherence-widget"
      className="rounded-3xl border border-border/75 bg-card/85 p-6 shadow-card-sm backdrop-blur-md space-y-4 transition-all duration-300 hover:shadow-card"
    >
      <div className="flex items-center justify-between">
        <div>
          <SectionLabel tone="cyan" leading={<BarChart3 className="size-3.5" />}>
            Adherence Trend
          </SectionLabel>
          <h2 className="font-heading text-lg font-bold text-ink-900 dark:text-ink-100">
            7-Day History
          </h2>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs text-primary font-medium hover:text-primary-dark"
          nativeButton={false}
          render={<Link href="/adherence" />}
        >
          <span>Full Analytics</span>
          <ArrowRight className="size-3.5" />
        </Button>
      </div>

      <div className="h-56 w-full pt-2">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No adherence records for the past 7 days.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
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
                ticks={[0, 50, 100]}
                stroke={CHART_AXIS}
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => `${val}%`}
                fontFamily={CHART_FONT_FAMILY}
              />
              <ReferenceLine
                y={90}
                stroke="var(--color-chart-2)"
                strokeDasharray="3 3"
                strokeOpacity={0.8}
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
                          Adherence:{" "}
                          <span className="font-semibold text-primary">
                            {item.adherencePercent !== null
                              ? `${item.adherencePercent}%`
                              : "No doses"}
                          </span>
                        </p>
                        <p>
                          Taken: {item.taken} of {item.scheduled}
                        </p>
                        {item.missed > 0 && (
                          <p className="text-rose-500 font-medium">
                            Missed: {item.missed}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="adherencePercent"
                name="Daily Adherence"
                fill="var(--primary)"
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/60">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-primary shrink-0" />
          <span>Daily Rate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-0.5 w-3.5 bg-secondary shrink-0" />
          <span>90% Target</span>
        </div>
      </div>
    </section>
  );
}

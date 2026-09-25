"use client";

import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { TrendChart } from "@/components/ui/chart";
import type { ChartDatum } from "@/components/ui/chart-types";
import { formatDateKey } from "@/lib/format";
import type { ReportGranularity } from "@/shared/enums";
import type { ReportTrendPoint } from "@/shared/types";

interface TrendChartBlockProps {
  trend: ReportTrendPoint[];
  granularity: ReportGranularity;
  className?: string;
}

function formatTickLabel(label: string, granularity: ReportGranularity): string {
  if (granularity === "daily") {
    try {
      return formatDateKey(label, "short");
    } catch {
      return label;
    }
  }

  if (granularity === "weekly") {
    const match = label.match(/^\d{4}-W(\d{2})$/);
    if (match && match[1]) {
      return `W${parseInt(match[1], 10)}`;
    }
    return label;
  }

  if (granularity === "monthly") {
    const match = label.match(/^\d{4}-(\d{2})$/);
    if (match && match[1]) {
      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];
      const mIdx = parseInt(match[1], 10) - 1;
      const monthName = monthNames[mIdx];
      if (monthName) return monthName;
      return match[1];
    }
    return label;
  }

  return label;
}

/**
 * Phase 20 — Adherence Trend Chart (plan §10.9, §11.11, §20).
 *
 * Renders an area trend visualization of adherence percentages over time.
 */
export function TrendChartBlock({
  trend,
  granularity,
  className,
}: TrendChartBlockProps) {
  const chartData: ChartDatum[] = useMemo(() => {
    return trend.map((t) => ({
      label: t.label,
      adherence: t.adherence ?? 0,
      taken: t.taken,
      missed: t.missed,
      skipped: t.skipped,
    }));
  }, [trend]);

  const series = useMemo(
    () => [
      {
        key: "adherence",
        name: "Adherence",
        color: "var(--color-primary)",
      },
    ],
    [],
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card-sm">
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary-tint text-primary-dark dark:text-primary">
            <TrendingUp className="size-4.5" />
          </div>
          <div>
            <h3 className="font-heading text-base font-semibold text-ink-900 dark:text-ink-100">
              Adherence Trend
            </h3>
            <p className="text-xs text-muted-foreground">
              Rate of intake compliance across each {granularity} interval
            </p>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <TrendChart
          kind="area"
          data={chartData}
          series={series}
          xKey="label"
          height={250}
          formatValue={(v) => `${v}%`}
          xTickFormatter={(label) => formatTickLabel(String(label), granularity)}
          emptyTitle="No trend points"
          emptyDescription="Scheduled dose records will generate the compliance curve."
          className={className}
        />
      </div>
    </div>
  );
}

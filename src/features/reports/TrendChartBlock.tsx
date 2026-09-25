"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendChart } from "@/components/ui/chart";
import type { ChartDatum } from "@/components/ui/chart-types";
import { formatPercent } from "@/lib/format";
import type { ReportDTO } from "@/shared/types";

/**
 * §11.11 trend chart — the same `ReportTrendPoint` series as the table, plotted as
 * an adherence% line. `null` values become chart gaps, not zeroes.
 */
export function TrendChartBlock({ report }: { report: ReportDTO }) {
  const data = report.trend.map((point) => ({
    label: point.label,
    adherence: point.adherence,
  })) as ChartDatum[];

  return (
    <Card className="shadow-card-sm">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-ink-900">Adherence trend</CardTitle>
      </CardHeader>
      <CardContent>
        <TrendChart
          kind="area"
          data={data}
          series={[
            { key: "adherence", name: "Adherence" },
          ]}
          xKey="label"
          height={240}
          formatValue={(v) => (typeof v === "number" ? formatPercent(v) : String(v))}
          emptyTitle="No trend data yet"
          emptyDescription="Take doses in this range to see your adherence trend."
          legend={false}
        />
      </CardContent>
    </Card>
  );
}
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendChart } from "@/components/ui/chart";
import type { ChartDatum } from "@/components/ui/chart-types";
import { SectionLabel } from "@/components/ui/section-label";
import { formatDayHeading } from "@/lib/format";
import type { AdherenceDay } from "@/shared/types";

/**
 * §11.4 widget 4 — 7-day adherence area chart. Same `AdherenceDay` series the
 * `/adherence` page renders (from `dashboard.get`'s summary), compacted here.
 */
export function AdherenceWidget({ week }: { week: AdherenceDay[] }) {
  const data = week.map((d) => ({
    date: d.date,
    key: d.date,
    // `null` keeps Recharts from connecting gaps between days with no doses.
    adherencePercent: d.adherencePercent,
  })) as ChartDatum[];

  return (
    <section aria-label="7-day adherence trend">
      <SectionLabel tone="cyan">
        <span>7-Day Adherence</span>
      </SectionLabel>
      <Card className="mt-2 shadow-card-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-ink-900">
            Adherence trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart
            kind="area"
            data={data}
            series={[{ key: "adherencePercent", name: "Adherence", color: "var(--color-chart-1)" }]}
            xKey="date"
            height={220}
            formatValue={(v) => `${v}%`}
            xTickFormatter={(value) => formatDayHeading(String(value))}
            emptyTitle="No adherence data yet"
            emptyDescription="Once you start taking doses, your 7-day trend appears here."
          />
        </CardContent>
      </Card>
    </section>
  );
}
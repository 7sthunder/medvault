"use client";

import { useState } from "react";

import { useShell } from "@/components/layout/shell-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { RangePicker, type DateRange } from "@/components/ui/range-picker";
import { SectionLabel } from "@/components/ui/section-label";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { TrendChart } from "@/components/ui/chart";
import type { ChartDatum } from "@/components/ui/chart-types";
import { api } from "@/lib/trpc";
import { formatCount, formatDateKey, formatDayHeading } from "@/lib/format";
import { TIME_BUCKET_TEXT } from "@/shared/enums";
import type { RangePreset } from "@/shared/enums";
import type { AdherenceSummaryDTO } from "@/shared/types";
import { localDateKey, rangeByPreset } from "@/shared/times";

/**
 * §11.8 `/adherence` — range selector (7/30/90d + custom), stat rail, trend chart +
 * time-of-day pattern bars. Reads the shared `adherence.summary` so every number here
 * matches the dashboard widget and reports. Missed-dose heat strip is rendered from
 * the same `AdherenceDay` series.
 */
export function AdherencePage() {
  const { user } = useShell();
  const timeZone = user.timezone;
  const now = new Date();
  const defaultRange = presetDateRange("30d", timeZone, now);
  const [range, setRange] = useState<DateRange>(defaultRange);

  const input =
    detectPreset(range, timeZone, now) === "custom"
      ? { range: "custom" as const, from: range.from, to: range.to }
      : { range: detectPreset(range, timeZone, now) };

  const summary = api.adherence.summary.useQuery(input, { staleTime: 30_000 });

  return (
    <main className="mx-auto max-w-5xl">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-ink-900">Adherence</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            How consistently you take your doses — across any window you choose.
          </p>
        </div>
        <RangePicker
          value={range}
          onChange={setRange}
          timeZone={timeZone}
          now={now}
          ariaLabel="Adherence date range"
        />
      </header>

      {summary.isLoading ? (
        <div className="mt-6 grid gap-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-xl" />
        </div>
      ) : summary.isError || !summary.data ? (
        <ErrorState
          className="mt-10"
          title="Couldn't load adherence"
          action={
            <Button variant="outline" onClick={() => void summary.refetch()}>
              Try again
            </Button>
          }
        />
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          <StatRail summary={summary.data} />
          <TrendCard data={summary.data} />
          <PatternCard summary={summary.data} />
          <MissedStrip summary={summary.data} />
        </div>
      )}
    </main>
  );
}

/** Shared stat rail — adherence%, taken/missed/skipped/snoozed/scheduled, streaks. */
function StatRail({ summary }: { summary: AdherenceSummaryDTO }) {
  const { adherencePercent, taken, missed, skipped, snoozed, scheduled, streak } = summary;
  return (
    <section aria-label="Adherence summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        title="Adherence"
        value={adherencePercent == null ? "—" : `${adherencePercent}%`}
        tone="emerald"
        subtitle={adherencePercent == null ? "no required doses" : "of required doses"}
      />
      <StatCard title="Current streak" value={String(streak.current)} tone="violet" subtitle="days in a row" />
      <StatCard title="Longest" value={String(streak.longest)} tone="cyan" subtitle="days in a row" />
      <StatCard
        title="Scheduled"
        value={formatCount(scheduled)}
        tone="blue"
        subtitle={`${taken} taken · ${missed} missed · ${skipped} skipped · ${snoozed} snoozed`}
      />
    </section>
  );
}

function TrendCard({ data }: { data: AdherenceSummaryDTO }) {
  const byDate = new Map<string, number | null>(data.trend.rolling7.map((d) => [d.date, d.value]));
  const daily = data.days.map((d) => ({
    date: d.date,
    // `null` keeps Recharts from connecting gaps between days with no doses.
    adherencePercent: d.adherencePercent,
    value: byDate.get(d.date) ?? null,
  })) as ChartDatum[];

  return (
    <section aria-label="Adherence trend">
      <SectionLabel tone="cyan">
        <span>Trend</span>
        <span className="opacity-60">· {data.trend.direction}</span>
      </SectionLabel>
      <Card className="mt-2 shadow-card-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-ink-900">
            Daily adherence (%) · 7-day average
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart
            kind="line"
            data={daily}
            series={[
              { key: "adherencePercent", name: "Daily", color: "var(--color-chart-1)" },
              { key: "value", name: "7-day avg", color: "var(--color-chart-4)" },
            ]}
            xKey="date"
            height={240}
            formatValue={(v) => `${v}%`}
            xTickFormatter={(value) => formatDayHeading(String(value))}
            emptyTitle="No adherence data yet"
            emptyDescription="Once you start taking doses, your trend appears here."
          />
        </CardContent>
      </Card>
    </section>
  );
}

function PatternCard({ summary }: { summary: AdherenceSummaryDTO }) {
  const bars = summary.byBucket
    .filter((b) => b.scheduled > 0)
    .map((b) => ({
      bucket: TIME_BUCKET_TEXT[b.bucket],
      // `rate` can be null; Recharts treats it as a gap.
      rate: b.rate,
    })) as ChartDatum[];
  return (
    <section aria-label="Time of day pattern">
      <SectionLabel tone="magenta">
        <span>Time of day</span>
      </SectionLabel>
      <Card className="mt-2 shadow-card-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-ink-900">
            Adherence by time of day
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart
            kind="bar"
            data={bars as ChartDatum[]}
            series={[{ key: "rate", name: "Adherence", color: "var(--color-chart-3)" }]}
            xKey="bucket"
            height={180}
            formatValue={(v) => `${v}%`}
            emptyTitle="No bucket data"
            emptyDescription="Resolved doses across morning, afternoon, evening and night appear here."
          />
        </CardContent>
      </Card>
    </section>
  );
}

/** §11.8 missed-dose calendar heat strip — tinted squares per resolved day. */
function MissedStrip({ summary }: { summary: AdherenceSummaryDTO }) {
  const days = summary.days;
  const withDoses = days.filter((d) => d.scheduled > 0);
  return (
    <section aria-label="Missed dose heat strip">
      <SectionLabel tone="emerald">
        <span>Daily overview</span>
      </SectionLabel>
      {withDoses.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          No doses resolved in this window yet.
        </p>
      ) : (
        <div className="mt-2 grid grid-cols-7 gap-1.5 sm:grid-cols-12">
          {days.map((d) => {
            const tone =
              d.scheduled === 0
                ? "bg-muted"
                : d.missed > 0
                  ? "bg-red-tint text-red"
                  : d.adherencePercent == null
                    ? "bg-muted"
                    : d.adherencePercent >= 75
                      ? "bg-primary-tint text-primary-dark"
                      : "bg-amber-tint text-amber-600";
            return (
              <div
                key={d.date}
                title={`${formatDateKey(d.date)} · ${d.adherencePercent ?? "—"}%`}
                className={`flex aspect-square flex-col items-center justify-center rounded-md text-[10px] font-semibold ${tone}`}
              >
                <span aria-hidden="true">{Number(d.date.slice(8))}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function presetDateRange(preset: "7d" | "30d" | "90d", timeZone: string, now: Date): DateRange {
  const { from, to } = rangeByPreset(preset, { now, timeZone });
  return { from: localDateKey(from, timeZone), to: localDateKey(to, timeZone) };
}

function detectPreset(range: DateRange, timeZone: string, now: Date): RangePreset {
  for (const preset of ["7d", "30d", "90d"] as const) {
    const expected = presetDateRange(preset, timeZone, now);
    if (expected.from === range.from && expected.to === range.to) return preset;
  }
  return "custom";
}
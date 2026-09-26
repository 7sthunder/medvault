"use client";

import { useState } from "react";

import { useNow } from "@/components/layout/clock-context";
import { useShell } from "@/components/layout/shell-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { RangePicker, type DateRange } from "@/components/ui/range-picker";
import { SectionLabel } from "@/components/ui/section-label";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { TrendChart } from "@/components/ui/chart";
import type { ChartDatum } from "@/components/ui/chart-types";
import { api } from "@/lib/trpc";
import {
  formatCount,
  formatDateKey,
  formatDateRange,
  formatDayHeading,
  formatMonthCaption,
} from "@/lib/format";
import { TIME_BUCKET_TEXT } from "@/shared/enums";
import type { RangePreset } from "@/shared/enums";
import type { AdherenceDay, AdherenceSummaryDTO } from "@/shared/types";
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
  const now = useNow();
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
          <MissedCalendar summary={summary.data} todayKey={localDateKey(now, timeZone)} />
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
      <StatCard
        title="Current streak"
        value={String(streak.current)}
        tone="violet"
        subtitle="days in a row"
      />
      <StatCard
        title="Longest"
        value={String(streak.longest)}
        tone="cyan"
        subtitle="days in a row"
      />
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

/** §11.8 missed-dose calendar — one month block per calendar month the window touches. */
function MissedCalendar({ summary, todayKey }: { summary: AdherenceSummaryDTO; todayKey: string }) {
  const days = summary.days;
  const byDate = new Map(days.map((d) => [d.date, d]));
  const months = monthBlocks(days);
  const first = days.at(0);
  const last = days.at(-1);
  // `days` is the whole requested window, so "no doses anywhere in it" — not "no days" — is the
  // state worth calling out.
  const hasDoses = days.some((d) => d.scheduled > 0);

  return (
    <section aria-label="Missed dose calendar">
      <SectionLabel tone="emerald">
        <span>Daily overview</span>
      </SectionLabel>
      {!hasDoses || !first || !last ? (
        <p className="mt-2 text-sm text-muted-foreground">No doses resolved in this window yet.</p>
      ) : (
        <Card className="mt-2 shadow-card-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-ink-900">
              Missed doses by day · {formatDateRange(first.date, last.date)}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-start sm:gap-x-7 sm:gap-y-6">
            {months.map((month) => (
              <MonthGrid key={month.key} month={month} byDate={byDate} todayKey={todayKey} />
            ))}
          </CardContent>
          <CardFooter className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
            <LegendSwatch tone="bg-primary-tint text-primary-dark" label="All doses taken" />
            <LegendSwatch tone="bg-amber-tint text-amber-600" label="Partly taken" />
            <LegendSwatch tone="bg-red-tint text-red" label="Missed a dose" />
            <LegendSwatch tone="bg-muted" label="No doses due" />
            <span className="ml-auto">Ringed day is today</span>
          </CardFooter>
        </Card>
      )}
    </section>
  );
}

/** Column headers, Sunday-first to match the 12-hour times used elsewhere in the app. */
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** How a day is tinted. One source of truth, so the calendar and its legend cannot drift. */
type DayTone = "full" | "partial" | "missed" | "empty" | "outside";

/** One month of cells: leading blanks, then every day of that month, cut into whole weeks. */
interface MonthBlock {
  /** First day of the month as a date key — the caption is formatted from it. */
  key: string;
  /** `null` is a blank cell that keeps the week grid square. */
  days: (string | null)[];
}

/**
 * The calendar months a day series spans.
 *
 * Date keys are timezone-less, so every hop goes through `Date.UTC`: a local `getDay()` here
 * would shift the whole grid by one day for anyone west of UTC, which is the trap the shared
 * formatters avoid by pinning date keys to UTC.
 */
function monthBlocks(days: AdherenceDay[]): MonthBlock[] {
  const first = days[0]?.date;
  const last = days[days.length - 1]?.date;
  if (!first || !last) return [];

  const blocks: MonthBlock[] = [];
  const endYear = Number(last.slice(0, 4));
  const endMonth = Number(last.slice(5, 7)) - 1;

  for (let year = Number(first.slice(0, 4)), month = Number(first.slice(5, 7)) - 1; ; month++) {
    if (year > endYear || (year === endYear && month > endMonth)) break;
    const prefix = `${year}-${pad2(month + 1)}`;
    const leading = new Date(Date.UTC(year, month, 1)).getUTCDay();
    const length = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    blocks.push({
      key: `${prefix}-01`,
      days: [
        ...Array.from<null, null>({ length: leading }, () => null),
        ...Array.from({ length }, (_, i) => `${prefix}-${pad2(i + 1)}`),
      ],
    });
    if (month === 11) {
      year += 1;
      month = -1;
    }
  }
  return blocks;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function dayTone(day: AdherenceDay | undefined): DayTone {
  if (!day) return "outside";
  if (day.scheduled === 0) return "empty";
  if (day.missed > 0) return "missed";
  if (day.adherencePercent == null) return "empty";
  return day.adherencePercent >= 75 ? "full" : "partial";
}

const DAY_TONE_CLASS: Record<DayTone, string> = {
  full: "bg-primary-tint text-primary-dark",
  partial: "bg-amber-tint text-amber-600",
  missed: "bg-red-tint text-red",
  empty: "bg-muted",
  // Outside the requested window: still shown, so the month reads as a real calendar, but flat.
  outside: "text-ink-500/50",
};

function MonthGrid({
  month,
  byDate,
  todayKey,
}: {
  month: MonthBlock;
  byDate: Map<string, AdherenceDay>;
  todayKey: string;
}) {
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < month.days.length; i += 7) weeks.push(month.days.slice(i, i + 7));

  return (
    <div
      role="grid"
      aria-label={formatMonthCaption(month.key)}
      className="w-full min-w-[15rem] flex-1 sm:max-w-xs"
    >
      <p aria-hidden="true" className="mb-2 text-xs font-semibold text-ink-800">
        {formatMonthCaption(month.key)}
      </p>
      <div role="row" className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((weekday) => (
          <div
            key={weekday}
            role="columnheader"
            aria-label={weekday}
            className="pb-1 text-center text-[10px] font-semibold uppercase text-ink-500"
          >
            {weekday.slice(0, 1)}
          </div>
        ))}
      </div>
      {weeks.map((week) => (
        <div
          role="row"
          key={week.map((d) => d ?? "_").join("-")}
          className="grid grid-cols-7 gap-1"
        >
          {week.map((key, i) => {
            if (key === null) {
              return <div key={`blank-${i}`} role="gridcell" aria-hidden="true" />;
            }
            const day = byDate.get(key);
            const detail = dayCellDetail(key, day);
            const isToday = key === todayKey;
            return (
              <div
                key={key}
                role="gridcell"
                title={detail}
                aria-label={detail}
                aria-current={isToday ? "date" : undefined}
                className={`flex aspect-square items-center justify-center rounded-md text-[11px] font-semibold ${DAY_TONE_CLASS[dayTone(day)]} ${
                  isToday ? "ring-2 ring-primary ring-offset-1 ring-offset-card" : ""
                }`}
              >
                <span aria-hidden="true">{Number(key.slice(8))}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** What a day says on hover, and what a screen reader hears for it. */
function dayCellDetail(key: string, day: AdherenceDay | undefined): string {
  if (!day) return `${formatDateKey(key)} — outside this range`;
  if (day.scheduled === 0) return `${formatDateKey(key)} — no doses due`;
  const percent = day.adherencePercent == null ? "—" : `${day.adherencePercent}%`;
  const missed = day.missed > 0 ? `, ${day.missed} missed` : "";
  return `${formatDateKey(key)} — ${percent} (${day.taken} of ${day.scheduled} taken${missed})`;
}

function LegendSwatch({ tone, label }: { tone: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span aria-hidden="true" className={`size-3 rounded-sm ${tone}`} />
      {label}
    </span>
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

"use client";

import { useState } from "react";
import { CalendarX2 } from "lucide-react";

import { useShell } from "@/components/layout/shell-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { RangePicker, type DateRange } from "@/components/ui/range-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { api } from "@/lib/trpc";
import { formatCount, formatPercent } from "@/lib/format";
import type { ReportGranularity } from "@/shared/enums";
import type { ReportDTO } from "@/shared/types";
import { localDateKey, rangeByPreset } from "@/shared/times";

import { DownloadButton } from "./DownloadButton";
import { GranularityTabs } from "./GranularityTabs";
import { MissedAnalysis } from "./MissedAnalysis";
import { SummaryTable } from "./SummaryTable";
import { TrendChartBlock } from "./TrendChartBlock";

/**
 * §11.11 `/reports` — adherence reports from real data. Granularity (daily/weekly/monthly),
 * range (7/30/90/custom), scope (all / per medication). Output: stat cards, breakdown table,
 * trend chart, missed-dose analysis, CSV download. Reads `reports.generate` which is the same
 * `adherence.summary` pipeline as the dashboard — numbers identical everywhere.
 */
export function ReportsPage() {
  const { user } = useShell();
  const timeZone = user.timezone;
  const now = new Date();
  const defaultRange = presetRange("30d", timeZone, now);
  const [range, setRange] = useState<DateRange>(defaultRange);
  const [granularity, setGranularity] = useState<ReportGranularity>("daily");
  const [medicationId, setMedicationId] = useState<string | null>(null);

  const meds = api.medication.list.useQuery(undefined, { staleTime: 30_000 });

  const input = {
    granularity,
    from: range.from,
    to: range.to,
    medicationId: medicationId ?? undefined,
  };
  const report = api.reports.generate.useQuery(input, { staleTime: 30_000 });

  return (
    <main className="mx-auto max-w-5xl">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-ink-900">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Identical to your dashboard numbers — period by period, exportable.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DownloadButton from={range.from} to={range.to} granularity={granularity} medicationId={medicationId} />
          <RangePicker
            value={range}
            onChange={setRange}
            timeZone={timeZone}
            now={now}
            ariaLabel="Report date range"
          />
        </div>
      </header>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <GranularityTabs value={granularity} onChange={setGranularity} />
        <label className="grid gap-1 text-xs font-medium text-muted-foreground">
          Scope
          <select
            value={medicationId ?? ""}
            onChange={(e) => setMedicationId(e.target.value || null)}
            className="h-9 rounded-lg border border-input bg-background px-2 text-sm text-ink-900 outline-none focus-visible:ring-4 focus-visible:ring-primary-ring"
          >
            <option value="">All medications</option>
            {meds.data?.medications.map((med) => (
              <option key={med.id} value={med.id}>
                {med.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {report.isLoading ? (
        <div className="mt-6 flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      ) : report.isError || !report.data ? (
        <ErrorState
          className="mt-10"
          title="Couldn't load the report"
          action={
            <Button variant="outline" onClick={() => void report.refetch()}>
              Try again
            </Button>
          }
        />
      ) : report.data.table.length === 0 ? (
        <EmptyState
          className="mt-10"
          icon={CalendarX2}
          title="No data to report"
          description="Add medications and take a few doses to generate reports."
        />
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          <StatRail report={report.data} />
          <TrendChartBlock report={report.data} />
          <Card className="shadow-card-sm">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-ink-900">Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <SummaryTable granularity={granularity} rows={report.data.table} />
            </CardContent>
          </Card>
          <Card className="shadow-card-sm">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-ink-900">Missed-dose analysis</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <MissedAnalysis granularity={granularity} rows={report.data.table} />
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}

function StatRail({ report }: { report: ReportDTO }) {
  const { table } = report;
  const totals = table.reduce(
    (acc, row) => ({
      scheduled: acc.scheduled + row.scheduled,
      taken: acc.taken + row.taken,
      missed: acc.missed + row.missed,
      skipped: acc.skipped + row.skipped,
    }),
    { scheduled: 0, taken: 0, missed: 0, skipped: 0 },
  );
  const attended = totals.taken + totals.missed + totals.skipped;
  const percent = attended > 0 ? (totals.taken / attended) * 100 : null;

  return (
    <section aria-label="Report summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        title="Adherence"
        value={percent == null ? "—" : formatPercent(percent)}
        tone="emerald"
        subtitle={percent == null ? "no required doses" : "of required doses"}
      />
      <StatCard title="Scheduled" value={formatCount(totals.scheduled)} tone="blue" subtitle="doses in range" />
      <StatCard
        title="Taken"
        value={formatCount(totals.taken)}
        tone="cyan"
        subtitle={`of ${formatCount(totals.scheduled)} scheduled`}
      />
      <StatCard
        title="Missed"
        value={formatCount(totals.missed)}
        tone="amber"
        subtitle={`${formatCount(totals.skipped)} skipped`}
      />
    </section>
  );
}

function presetRange(preset: "7d" | "30d" | "90d", timeZone: string, now: Date): DateRange {
  const { from, to } = rangeByPreset(preset, { now, timeZone });
  return { from: localDateKey(from, timeZone), to: localDateKey(to, timeZone) };
}
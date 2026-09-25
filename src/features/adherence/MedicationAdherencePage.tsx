"use client";

import { useState } from "react";
import { Pill } from "lucide-react";

import { useNow } from "@/components/layout/clock-context";
import { useShell } from "@/components/layout/shell-context";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { DataTable } from "@/components/ui/data-table";
import { ErrorState } from "@/components/ui/error-state";
import { RangePicker, type DateRange } from "@/components/ui/range-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/trpc";
import { formatCount } from "@/lib/format";
import { FREQUENCY_LABEL_TEXT, TIME_BUCKET_TEXT } from "@/shared/enums";
import type { RangePreset } from "@/shared/enums";
import type { MedicationPerformanceDTO } from "@/shared/types";
import { localDateKey, rangeByPreset } from "@/shared/times";

import { medTintClasses } from "../medications/medication-utils";

/**
 * §11.8 `/adherence/medications` — per-medication performance table for the window:
 * med, frequency, scheduled/taken/missed/skipped, adherence%, best bucket, last taken.
 * Row → medication detail. All numbers come from `adherence.byMedication`.
 */
export function MedicationAdherencePage() {
  const { user } = useShell();
  const timeZone = user.timezone;
  const now = useNow();
  const defaultRange = presetDateRange("30d", timeZone, now);
  const [range, setRange] = useState<DateRange>(defaultRange);

  const input =
    detectPreset(range, timeZone, now) === "custom"
      ? { range: "custom" as const, from: range.from, to: range.to }
      : { range: detectPreset(range, timeZone, now) };

  const byMed = api.adherence.byMedication.useQuery(input, { staleTime: 30_000 });

  return (
    <main className="mx-auto max-w-5xl">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-ink-900">
            Medication adherence
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Per-medication performance over the selected window.
          </p>
        </div>
        <RangePicker
          value={range}
          onChange={setRange}
          timeZone={timeZone}
          now={now}
          ariaLabel="Medication adherence date range"
        />
      </header>

      {byMed.isLoading ? (
        <Skeleton className="mt-6 h-80 rounded-xl" />
      ) : byMed.isError || !byMed.data ? (
        <ErrorState
          className="mt-10"
          title="Couldn't load medication adherence"
          action={
            <Button variant="outline" onClick={() => void byMed.refetch()}>
              Try again
            </Button>
          }
        />
      ) : (
        <div className="mt-6 flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-card-sm">
          <DataTable<MedicationPerformanceDTO>
            ariaLabel="Medication adherence"
            rows={byMed.data}
            pageSize={10}
            rowKey={(row) => row.medicationId}
            emptyTitle="No medications with data"
            emptyDescription="Add a medication and log doses for performance to show up here."
            columns={[
              {
                key: "medication",
                header: "Medication",
                value: (row) => row.name,
                render: (row) => (
                  <div className="flex items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${medTintClasses(row.color)}`}
                    >
                      <Pill className="size-4" aria-hidden="true" />
                    </span>
                    <span className="truncate font-semibold text-ink-900">{row.name}</span>
                  </div>
                ),
              },
              {
                key: "frequency",
                header: "Frequency",
                sortable: false,
                value: (row) => FREQUENCY_LABEL_TEXT[row.frequencyLabel],
                render: (row) => FREQUENCY_LABEL_TEXT[row.frequencyLabel],
                hideBelow: "sm",
              },
              {
                key: "adherencePercent",
                header: "Adherence",
                value: (row) => row.adherencePercent ?? -1,
                render: (row) =>
                  row.adherencePercent == null ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <Chip
                      tone={
                        row.adherencePercent >= 75
                          ? "emerald"
                          : row.adherencePercent >= 50
                            ? "amber"
                            : "magenta"
                      }
                    >
                      {row.adherencePercent}%
                    </Chip>
                  ),
              },
              {
                key: "scheduled",
                header: "Scheduled",
                value: (row) => row.scheduled,
                render: (row) => formatCount(row.scheduled),
                align: "right",
              },
              {
                key: "taken",
                header: "Taken",
                value: (row) => row.taken,
                render: (row) => (
                  <span className="text-primary-dark">{formatCount(row.taken)}</span>
                ),
                align: "right",
              },
              {
                key: "missed",
                header: "Missed",
                value: (row) => row.missed,
                render: (row) => <span className="text-red">{formatCount(row.missed)}</span>,
                align: "right",
                hideBelow: "sm",
              },
              {
                key: "skipped",
                header: "Skipped",
                value: (row) => row.skipped,
                render: (row) => <span className="text-amber-600">{formatCount(row.skipped)}</span>,
                align: "right",
                hideBelow: "md",
              },
              {
                key: "best",
                header: "Best time",
                sortable: false,
                value: (row) => (row.bestBucket ? TIME_BUCKET_TEXT[row.bestBucket] : "—"),
                render: (row) => (row.bestBucket ? TIME_BUCKET_TEXT[row.bestBucket] : "—"),
                hideBelow: "md",
              },
            ]}
            onRetry={() => void byMed.refetch()}
          />
        </div>
      )}
    </main>
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

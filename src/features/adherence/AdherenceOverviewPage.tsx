"use client";

import { useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RangePicker, type DateRange } from "@/components/ui/range-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/trpc";
import { localDateKey, rangeByPreset } from "@/shared/times";
import { AdherenceNavTabs } from "./AdherenceNavTabs";
import { MissedHeatStrip } from "./MissedHeatStrip";
import { StatRail } from "./StatRail";
import { TimeOfDayPattern } from "./TimeOfDayPattern";
import { TrendChart } from "./TrendChart";

export function AdherenceOverviewPage() {
  const [range, setRange] = useState<DateRange>(() => {
    const { from, to } = rangeByPreset("30d", {
      now: new Date(),
      timeZone: "UTC",
    });
    return {
      from: localDateKey(from, "UTC"),
      to: localDateKey(to, "UTC"),
    };
  });

  const {
    data: summary,
    isLoading,
    error,
    refetch,
  } = api.adherence.summary.useQuery({
    from: new Date(`${range.from}T00:00:00Z`),
    to: new Date(`${range.to}T23:59:59.999Z`),
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink-900 dark:text-ink-100">
            Adherence Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor regimen adherence, consecutive streaks, and timing trends.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <RangePicker value={range} onChange={setRange} />
          <AdherenceNavTabs />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {/* StatRail Skeleton */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
          {/* TrendChart Skeleton */}
          <Skeleton className="h-80 w-full rounded-2xl" />
          {/* Patterns Skeleton */}
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red/20 bg-red-tint/20 p-8 text-center space-y-3">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-red-tint text-red">
            <AlertCircle className="size-6" />
          </div>
          <h2 className="font-heading text-lg font-semibold text-ink-900 dark:text-ink-100">
            Unable to load adherence metrics
          </h2>
          <p className="text-sm text-muted-foreground">
            {error.message || "An error occurred while fetching your adherence data."}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            className="gap-2"
          >
            <RefreshCw className="size-3.5" />
            <span>Retry</span>
          </Button>
        </div>
      ) : summary ? (
        <div className="space-y-6">
          {/* 1. Stat Rail */}
          <StatRail summary={summary} />

          {/* 2. Adherence Trend Chart */}
          <TrendChart trend={summary.trend} />

          {/* 3. Time-of-Day Pattern Grid */}
          <TimeOfDayPattern patterns={summary.byBucket} />

          {/* 4. Calendar Heat Strip */}
          <MissedHeatStrip days={summary.days} />
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Clock,
  Pill,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { RangePicker, type DateRange } from "@/components/ui/range-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/trpc";
import { TIME_BUCKET_TEXT } from "@/shared/enums";
import { localDateKey, rangeByPreset } from "@/shared/times";
import { AdherenceNavTabs } from "./AdherenceNavTabs";

export function MedicationPerformanceTable() {
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
    data: performance,
    isLoading,
    error,
    refetch,
  } = api.adherence.byMedication.useQuery({
    from: new Date(`${range.from}T00:00:00Z`),
    to: new Date(`${range.to}T23:59:59.999Z`),
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink-900 dark:text-ink-100">
            Medication Performance
          </h1>
          <p className="text-sm text-muted-foreground">
            Per-prescription adherence rates, completion counts, and timing profiles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <RangePicker value={range} onChange={setRange} />
          <AdherenceNavTabs />
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <Skeleton className="size-4 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-6 w-16 rounded-md" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red/20 bg-red-tint/20 p-8 text-center space-y-3">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-red-tint text-red">
            <AlertCircle className="size-6" />
          </div>
          <h2 className="font-heading text-lg font-semibold text-ink-900 dark:text-ink-100">
            Unable to load medication performance
          </h2>
          <p className="text-sm text-muted-foreground">
            {error.message || "An error occurred while fetching performance data."}
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
      ) : !performance || performance.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8">
          <EmptyState
            icon={Pill}
            title="No medication performance data"
            description="You don't have any recorded doses for medications in this time period."
            action={
              <Button
                variant="default"
                className="gap-2"
                nativeButton={false}
                render={<Link href="/medications/new" />}
              >
                <span>Add Medication</span>
              </Button>
            }
          />
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-card-tint text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Medication</th>
                  <th className="px-5 py-3.5">Adherence Rate</th>
                  <th className="px-5 py-3.5">Breakdown</th>
                  <th className="px-5 py-3.5">Best Time</th>
                  <th className="px-5 py-3.5">Last Taken</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {performance.map((med) => {
                  const rateVal =
                    med.adherencePercent !== null
                      ? `${med.adherencePercent}%`
                      : "No data";
                  const percentNum = med.adherencePercent ?? 0;

                  return (
                    <tr
                      key={med.medicationId}
                      className="transition-colors hover:bg-card-tint/40"
                    >
                      {/* Name & Color */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="size-3 rounded-full shrink-0"
                            style={{
                              backgroundColor: med.color || "var(--primary)",
                            }}
                            aria-hidden="true"
                          />
                          <Link
                            href={`/medications/${med.medicationId}`}
                            className="font-heading font-semibold text-ink-900 dark:text-ink-100 hover:text-primary transition-colors text-sm"
                          >
                            {med.name}
                          </Link>
                        </div>
                      </td>

                      {/* Adherence Rate + Bar */}
                      <td className="px-5 py-4">
                        <div className="space-y-1.5 w-28">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-ink-900 dark:text-ink-100">
                              {rateVal}
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${percentNum}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Scheduled / Taken / Missed / Skipped */}
                      <td className="px-5 py-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                        <span className="text-primary font-semibold">
                          {med.taken} taken
                        </span>
                        {" · "}
                        <span className="text-red">{med.missed} missed</span>
                        {med.skipped > 0 && (
                          <>
                            {" · "}
                            <span className="text-amber">{med.skipped} skipped</span>
                          </>
                        )}
                        <span className="block text-[10px] text-muted-foreground/80">
                          {med.scheduled} total scheduled
                        </span>
                      </td>

                      {/* Best Time Bucket */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {med.bestBucket ? (
                          <Badge
                            variant="outline"
                            className="border-primary/40 bg-primary-tint text-primary text-[10px] gap-1"
                          >
                            <Clock className="size-3" />
                            <span>{TIME_BUCKET_TEXT[med.bestBucket]}</span>
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Last Taken */}
                      <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">
                        {med.lastTakenAt
                          ? new Date(med.lastTakenAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          : "Never"}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          nativeButton={false}
                          className="h-7 text-xs text-primary gap-1 px-2"
                          render={<Link href={`/medications/${med.medicationId}`} />}
                        >
                          <span>Details</span>
                          <ArrowRight className="size-3" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

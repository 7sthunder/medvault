"use client";

import { CheckCircle2, Clock, Pill, Sun, Sunset, Sunrise, Moon } from "lucide-react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { TIME_BUCKET_BOUNDS } from "@/shared/constants";
import { TIME_BUCKET_TEXT, type TimeBucket } from "@/shared/enums";
import type { ReportMissedAnalysis } from "@/shared/types";

interface MissedAnalysisProps {
  data: ReportMissedAnalysis;
  className?: string;
}

const BUCKET_ICONS: Record<TimeBucket, typeof Sunrise> = {
  morning: Sunrise,
  afternoon: Sun,
  evening: Sunset,
  night: Moon,
};

const BUCKET_TIMES: Record<TimeBucket, string> = {
  morning: `${String(TIME_BUCKET_BOUNDS.morning.start).padStart(2, "0")}:00 – ${String(TIME_BUCKET_BOUNDS.morning.end).padStart(2, "0")}:00`,
  afternoon: `${String(TIME_BUCKET_BOUNDS.afternoon.start).padStart(2, "0")}:00 – ${String(TIME_BUCKET_BOUNDS.afternoon.end).padStart(2, "0")}:00`,
  evening: `${String(TIME_BUCKET_BOUNDS.evening.start).padStart(2, "0")}:00 – ${String(TIME_BUCKET_BOUNDS.evening.end).padStart(2, "0")}:00`,
  night: `${String(TIME_BUCKET_BOUNDS.night.start).padStart(2, "0")}:00 – ${String(TIME_BUCKET_BOUNDS.night.end).padStart(2, "0")}:00`,
};

/**
 * Phase 20 — Multi-dimensional Missed Dose Analysis (plan §10.9, §11.11, §20).
 *
 * Compares missed dose vulnerability across time-of-day buckets (morning/afternoon/evening/night)
 * alongside a per-medication breakdown.
 */
export function MissedAnalysis({ data, className }: MissedAnalysisProps) {
  const totalMissed = data.byMedication.reduce((sum, m) => sum + m.missed, 0);

  return (
    <div className={cn("grid gap-6 lg:grid-cols-2", className)}>
      {/* 1. Time-of-day Bucket Distribution */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card-sm">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-secondary-tint text-secondary">
              <Clock className="size-4.5" />
            </div>
            <div>
              <h3 className="font-heading text-base font-semibold text-ink-900 dark:text-ink-100">
                Time-of-Day Pattern
              </h3>
              <p className="text-xs text-muted-foreground">
                Distribution of missed doses across schedule intervals
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {data.byBucket.map((bucket) => {
            const Icon = BUCKET_ICONS[bucket.bucket] ?? Clock;
            const hasDoses = bucket.scheduled > 0;
            const adherence = bucket.rate;
            const isVulnerable = bucket.missed > 0 && (adherence === null || adherence < 75);

            return (
              <div
                key={bucket.bucket}
                className={cn(
                  "rounded-xl border p-3.5 transition-colors",
                  isVulnerable
                    ? "border-rose-500/20 bg-rose-500/5 dark:bg-rose-500/10"
                    : "border-border/60 bg-muted/20 hover:bg-muted/40",
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-ink-900 dark:text-ink-100">
                      {TIME_BUCKET_TEXT[bucket.bucket]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({BUCKET_TIMES[bucket.bucket]})
                    </span>
                  </div>
                  {hasDoses ? (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs font-semibold tabular-nums",
                        adherence !== null && adherence >= 80 && "border-primary/20 bg-primary-tint text-primary-dark dark:text-primary",
                        adherence !== null && adherence >= 60 && adherence < 80 && "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
                        adherence !== null && adherence < 60 && "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400",
                      )}
                    >
                      {adherence}% Adherent
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">No doses</span>
                  )}
                </div>

                {hasDoses ? (
                  <div className="space-y-1.5">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          isVulnerable ? "bg-rose-500" : "bg-primary",
                        )}
                        style={{ width: `${adherence ?? 0}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{bucket.taken} taken / {bucket.scheduled} scheduled</span>
                      <span className={cn(bucket.missed > 0 && "font-semibold text-rose-600 dark:text-rose-400")}>
                        {bucket.missed} missed
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic">
                    No medication events scheduled in this window.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Per-Medication Breakdown */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card-sm">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-magenta-tint text-magenta-dark">
              <Pill className="size-4.5" />
            </div>
            <div>
              <h3 className="font-heading text-base font-semibold text-ink-900 dark:text-ink-100">
                Missed Doses by Medication
              </h3>
              <p className="text-xs text-muted-foreground">
                Ranked by volume of missed intake events
              </p>
            </div>
          </div>
        </div>

        {data.byMedication.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
            <Pill className="mb-2 size-8 text-muted-foreground/60" />
            <p className="text-sm font-medium text-ink-900 dark:text-ink-100">No medications logged</p>
            <p className="text-xs text-muted-foreground">No medication logs available in this window.</p>
          </div>
        ) : totalMissed === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-primary/20 bg-primary-tint/40 p-8 text-center">
            <CheckCircle2 className="mb-2 size-8 text-primary" />
            <p className="text-sm font-semibold text-primary-dark dark:text-primary">
              Zero Missed Doses!
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Every scheduled dose across all active medications was either taken or properly skipped.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.byMedication.map((med) => {
              const adherence = med.adherencePercent;
              return (
                <div
                  key={med.medicationId}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      aria-hidden="true"
                      className="size-3.5 shrink-0 rounded-full"
                      style={{ backgroundColor: med.color }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-100">
                        {med.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {med.scheduled} scheduled · {adherence !== null ? `${adherence}% rate` : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      {med.missed > 0 ? (
                        <span className="inline-flex items-center rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:text-rose-400">
                          {med.missed} missed
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground font-medium">
                          0 missed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { format } from "date-fns";
import { CheckCircle2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ScheduleProgressCardProps {
  totalCount: number;
  takenCount: number;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function ScheduleProgressCard({
  totalCount,
  takenCount,
  onRefresh,
  isRefreshing = false,
}: ScheduleProgressCardProps) {
  const todayFormatted = format(new Date(), "EEEE, MMMM d");
  const percent = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/85 p-6 shadow-card-sm backdrop-blur-md transition-all duration-300 hover:shadow-card hover:border-primary/30">
      {/* Subtle top accent gradient */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent"
        aria-hidden="true"
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary uppercase tracking-wide">
            Today&apos;s Regimen
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-ink-900 dark:text-ink-100 mt-1.5">
            {todayFormatted}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            {totalCount === 0
              ? "No doses scheduled for today."
              : `${takenCount} of ${totalCount} doses completed (${percent}%)`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-xs shadow-xs hover:border-primary/40 transition-all"
          >
            <RotateCw className={`mr-1.5 size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {percent === 100 && totalCount > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary shadow-[0_0_12px_rgba(16,185,129,0.25)]">
              <CheckCircle2 className="size-4" />
              <span>All Done!</span>
            </div>
          )}
        </div>
      </div>

      {totalCount > 0 && (
        <div className="mt-5 space-y-2">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/60 border border-border/40">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)] transition-all duration-700 ease-out"
              style={{ width: `${percent}%` }}
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      )}
    </div>
  );
}

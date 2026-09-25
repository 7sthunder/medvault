"use client";

import { Card } from "@/components/ui/card";
import { formatDateKey } from "@/lib/format";
import type { AdherenceDay } from "@/shared/types";

export interface MissedHeatStripProps {
  days: AdherenceDay[];
}

export function MissedHeatStrip({ days }: MissedHeatStripProps) {
  return (
    <Card className="p-5 space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3">
        <div>
          <h2 className="font-heading text-base font-semibold text-ink-900 dark:text-ink-100">
            Adherence Calendar Strip
          </h2>
          <p className="text-xs text-muted-foreground">
            Day-by-day regimen adherence records across the selected window.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1 sm:pt-0">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-primary shrink-0" />
            <span>Adherent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-amber shrink-0" />
            <span>Partial / Skipped</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-red shrink-0" />
            <span>Missed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-muted shrink-0" />
            <span>Rest Day</span>
          </div>
        </div>
      </div>

      {/* Heat strip tiles */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5 pt-1">
          {days.map((day) => {
            let colorClass = "bg-muted text-muted-foreground";
            let statusText = "Rest day (0 doses)";

            if (day.scheduled > 0) {
              if (day.missed > 0) {
                colorClass = "bg-red text-white";
                statusText = `${day.missed} missed, ${day.taken} taken`;
              } else if (day.skipped > 0) {
                colorClass = "bg-amber text-white";
                statusText = `${day.skipped} skipped, ${day.taken} taken`;
              } else if (day.taken === day.scheduled) {
                colorClass = "bg-primary text-primary-foreground";
                statusText = `All ${day.taken} doses completed`;
              }
            }

            return (
              <div
                key={day.date}
                className="group relative"
              >
                <div
                  className={`size-6 rounded-md transition-transform group-hover:scale-115 ${colorClass}`}
                  aria-label={`${day.date}: ${statusText}`}
                />

                {/* Floating tooltip */}
                <div className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 hidden -translate-x-1/2 rounded-md border border-border bg-card/95 px-2 py-1 text-[11px] font-medium text-ink-900 dark:text-ink-100 shadow-md backdrop-blur-md whitespace-nowrap z-20 group-hover:block">
                  <p className="font-semibold">{formatDateKey(day.date, "short")}</p>
                  <p className="text-[10px] text-muted-foreground">{statusText}</p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-muted-foreground pt-1">
          Hover over any tile to view detailed daily completion stats.
        </p>
      </div>
    </Card>
  );
}

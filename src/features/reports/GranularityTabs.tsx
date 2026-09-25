"use client";

import { cn } from "cn";
import {
  REPORT_GRANULARITIES,
  REPORT_GRANULARITY_TEXT,
  type ReportGranularity,
} from "@/shared/enums";

interface GranularityTabsProps {
  value: ReportGranularity;
  onChange: (value: ReportGranularity) => void;
  className?: string;
}

/**
 * Phase 20 — Granularity pill selector (Daily / Weekly / Monthly).
 */
export function GranularityTabs({
  value,
  onChange,
  className,
}: GranularityTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Report granularity"
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-border bg-muted/60 p-1 backdrop-blur-xs",
        className,
      )}
    >
      {REPORT_GRANULARITIES.map((granularity) => {
        const active = value === granularity;
        return (
          <button
            key={granularity}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(granularity)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wide transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-card text-ink-900 shadow-card-sm dark:text-ink-100"
                : "text-muted-foreground hover:text-ink-900 dark:hover:text-ink-100",
            )}
          >
            {REPORT_GRANULARITY_TEXT[granularity]}
          </button>
        );
      })}
    </div>
  );
}

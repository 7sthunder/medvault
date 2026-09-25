"use client";

import { Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MedicationDTO } from "@/shared/types";
import type { ActionFilterOption, DateRangePreset, HistoryFilterState } from "./types";

export interface FilterBarProps {
  filters: HistoryFilterState;
  onChange: (filters: HistoryFilterState) => void;
  medications: MedicationDTO[];
}

const RANGE_OPTIONS: { id: DateRangePreset; label: string }[] = [
  { id: "all", label: "All Time" },
  { id: "today", label: "Today" },
  { id: "7d", label: "7 Days" },
  { id: "30d", label: "30 Days" },
  { id: "90d", label: "90 Days" },
];

const ACTION_OPTIONS: { id: ActionFilterOption; label: string }[] = [
  { id: "all", label: "All Actions" },
  { id: "take", label: "Taken" },
  { id: "snooze", label: "Snoozed" },
  { id: "skip", label: "Skipped" },
  { id: "missed_auto", label: "Missed" },
];

export function FilterBar({ filters, onChange, medications }: FilterBarProps) {
  const isFiltered =
    filters.rangePreset !== "all" ||
    filters.action !== "all" ||
    Boolean(filters.medicationId);

  const handleRangeChange = (preset: DateRangePreset) => {
    let from: Date | undefined = undefined;
    const now = new Date();

    if (preset === "today") {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (preset === "7d") {
      from = new Date(now.getTime() - 7 * 86400000);
    } else if (preset === "30d") {
      from = new Date(now.getTime() - 30 * 86400000);
    } else if (preset === "90d") {
      from = new Date(now.getTime() - 90 * 86400000);
    }

    onChange({
      ...filters,
      rangePreset: preset,
      from,
      to: preset === "all" ? undefined : now,
    });
  };

  const handleActionChange = (action: ActionFilterOption) => {
    onChange({
      ...filters,
      action,
    });
  };

  const handleMedicationChange = (medId?: string) => {
    onChange({
      ...filters,
      medicationId: medId || undefined,
    });
  };

  const handleReset = () => {
    onChange({
      rangePreset: "all",
      action: "all",
      medicationId: undefined,
      from: undefined,
      to: undefined,
    });
  };

  return (
    <div
      data-testid="history-filter-bar"
      className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3.5 bg-background/95 backdrop-blur-md border-b border-border/80 space-y-3"
    >
      {/* Top Row: Medication Selector & Reset Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Filter className="size-3.5" />
          </div>
          <span className="font-heading text-xs font-bold uppercase tracking-wider text-ink-900 dark:text-ink-100">
            Filters
          </span>

          {/* Medication Selector Dropdown */}
          <select
            data-testid="medication-filter-select"
            aria-label="Filter by medication"
            value={filters.medicationId ?? ""}
            onChange={(e) => handleMedicationChange(e.target.value)}
            className="h-8 rounded-lg border border-input bg-card px-2.5 text-xs font-medium text-ink-900 dark:text-ink-100 focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">All Medications</option>
            {medications.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} {m.archivedAt ? "(Archived)" : ""}
              </option>
            ))}
          </select>
        </div>

        {isFiltered && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3" />
            <span>Reset filters</span>
          </Button>
        )}
      </div>

      {/* Filter Chips: Date Range & Action Type */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* Date Presets */}
        <div role="group" aria-label="Date range filter" className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-[11px] font-semibold text-muted-foreground mr-1 hidden sm:inline" aria-hidden="true">
            Range:
          </span>
          {RANGE_OPTIONS.map((opt) => {
            const active = filters.rangePreset === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={active}
                onClick={() => handleRangeChange(opt.id)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Action Presets */}
        <div role="group" aria-label="Action type filter" className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-[11px] font-semibold text-muted-foreground mr-1 hidden sm:inline" aria-hidden="true">
            Action:
          </span>
          {ACTION_OPTIONS.map((opt) => {
            const active = filters.action === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={active}
                onClick={() => handleActionChange(opt.id)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  active
                    ? "bg-secondary-tint text-secondary font-semibold border border-secondary/30 shadow-xs"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, ChevronDown, ChevronUp, FileSpreadsheet } from "lucide-react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateKey } from "@/lib/format";
import type { ReportGranularity } from "@/shared/enums";
import type { ReportRow } from "@/shared/types";
import type { SortDirection, TableSortField } from "./types";

interface SummaryTableProps {
  rows: ReportRow[];
  granularity: ReportGranularity;
  className?: string;
}

function formatPeriodDisplay(period: string, granularity: ReportGranularity): string {
  if (granularity === "daily") {
    try {
      return formatDateKey(period, "long");
    } catch {
      return period;
    }
  }

  if (granularity === "weekly") {
    // E.g. "2026-W39"
    const match = period.match(/^(\d{4})-W(\d{2})$/);
    if (match && match[1] && match[2]) {
      return `Week ${parseInt(match[2], 10)}, ${match[1]}`;
    }
    return period;
  }

  if (granularity === "monthly") {
    // E.g. "2026-09"
    const match = period.match(/^(\d{4})-(\d{2})$/);
    if (match && match[1] && match[2]) {
      const year = match[1];
      const monthIndex = parseInt(match[2], 10) - 1;
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
      ];
      return `${monthNames[monthIndex] ?? match[2]} ${year}`;
    }
    return period;
  }

  return period;
}

/**
 * Phase 20 — Summary Table showing period-level breakdown (plan §10.9, §11.11, §20).
 *
 * Sortable columns, accessible markup, adherence status badges, and mobile-friendly scroll.
 */
export function SummaryTable({
  rows,
  granularity,
  className,
}: SummaryTableProps) {
  const [sortField, setSortField] = useState<TableSortField>("period");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  function handleSort(field: TableSortField) {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  }

  const sortedRows = useMemo(() => {
    const list = [...rows];
    list.sort((a, b) => {
      let comparison = 0;
      if (sortField === "period") {
        comparison = a.period.localeCompare(b.period);
      } else if (sortField === "scheduled") {
        comparison = a.scheduled - b.scheduled;
      } else if (sortField === "taken") {
        comparison = a.taken - b.taken;
      } else if (sortField === "missed") {
        comparison = a.missed - b.missed;
      } else if (sortField === "skipped") {
        comparison = a.skipped - b.skipped;
      } else if (sortField === "adherence") {
        const rateA = a.adherencePercent ?? -1;
        const rateB = b.adherencePercent ?? -1;
        comparison = rateA - rateB;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return list;
  }, [rows, sortField, sortDirection]);

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8">
        <EmptyState
          icon={FileSpreadsheet}
          title="No records in this range"
          description="Adjust your date filters or granularity to view adherence audit data."
          compact
        />
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-card shadow-card-sm", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm" role="table">
          <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3.5 sm:px-6">
                <button
                  type="button"
                  onClick={() => handleSort("period")}
                  className="inline-flex items-center gap-1.5 hover:text-ink-900 focus-visible:outline-hidden dark:hover:text-ink-100"
                >
                  <span>Period</span>
                  {sortField === "period" ? (
                    sortDirection === "asc" ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />
                  ) : (
                    <ArrowUpDown className="size-3 text-muted-foreground/60" />
                  )}
                </button>
              </th>
              <th scope="col" className="px-4 py-3.5 text-right sm:px-6">
                <button
                  type="button"
                  onClick={() => handleSort("scheduled")}
                  className="inline-flex items-center gap-1.5 hover:text-ink-900 focus-visible:outline-hidden dark:hover:text-ink-100"
                >
                  <span>Scheduled</span>
                  {sortField === "scheduled" ? (
                    sortDirection === "asc" ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />
                  ) : (
                    <ArrowUpDown className="size-3 text-muted-foreground/60" />
                  )}
                </button>
              </th>
              <th scope="col" className="px-4 py-3.5 text-right sm:px-6">
                <button
                  type="button"
                  onClick={() => handleSort("taken")}
                  className="inline-flex items-center gap-1.5 hover:text-ink-900 focus-visible:outline-hidden dark:hover:text-ink-100"
                >
                  <span>Taken</span>
                  {sortField === "taken" ? (
                    sortDirection === "asc" ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />
                  ) : (
                    <ArrowUpDown className="size-3 text-muted-foreground/60" />
                  )}
                </button>
              </th>
              <th scope="col" className="px-4 py-3.5 text-right sm:px-6">
                <button
                  type="button"
                  onClick={() => handleSort("missed")}
                  className="inline-flex items-center gap-1.5 hover:text-ink-900 focus-visible:outline-hidden dark:hover:text-ink-100"
                >
                  <span>Missed</span>
                  {sortField === "missed" ? (
                    sortDirection === "asc" ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />
                  ) : (
                    <ArrowUpDown className="size-3 text-muted-foreground/60" />
                  )}
                </button>
              </th>
              <th scope="col" className="px-4 py-3.5 text-right sm:px-6">
                <button
                  type="button"
                  onClick={() => handleSort("skipped")}
                  className="inline-flex items-center gap-1.5 hover:text-ink-900 focus-visible:outline-hidden dark:hover:text-ink-100"
                >
                  <span>Skipped</span>
                  {sortField === "skipped" ? (
                    sortDirection === "asc" ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />
                  ) : (
                    <ArrowUpDown className="size-3 text-muted-foreground/60" />
                  )}
                </button>
              </th>
              <th scope="col" className="px-4 py-3.5 text-right sm:px-6">
                <button
                  type="button"
                  onClick={() => handleSort("adherence")}
                  className="inline-flex items-center gap-1.5 hover:text-ink-900 focus-visible:outline-hidden dark:hover:text-ink-100"
                >
                  <span>Adherence</span>
                  {sortField === "adherence" ? (
                    sortDirection === "asc" ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />
                  ) : (
                    <ArrowUpDown className="size-3 text-muted-foreground/60" />
                  )}
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedRows.map((row) => {
              const adherence = row.adherencePercent;
              const isHigh = adherence !== null && adherence >= 80;
              const isMed = adherence !== null && adherence >= 60 && adherence < 80;
              const isLow = adherence !== null && adherence < 60;

              return (
                <tr
                  key={row.period}
                  className="transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3.5 font-medium text-ink-900 sm:px-6 dark:text-ink-100">
                    <div className="flex flex-col">
                      <span>{formatPeriodDisplay(row.period, granularity)}</span>
                      <span className="text-xs text-muted-foreground">{row.period}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-muted-foreground sm:px-6">
                    {row.scheduled}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums font-medium text-ink-900 sm:px-6 dark:text-ink-100">
                    {row.taken}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums sm:px-6">
                    {row.missed > 0 ? (
                      <span className="font-semibold text-rose-600 dark:text-rose-400">
                        {row.missed}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-muted-foreground sm:px-6">
                    {row.skipped}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums sm:px-6">
                    {adherence !== null ? (
                      <Badge
                        variant="secondary"
                        className={cn(
                          "tabular-nums text-xs font-semibold",
                          isHigh && "border-primary/20 bg-primary-tint text-primary-dark dark:text-primary",
                          isMed && "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
                          isLow && "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400",
                        )}
                      >
                        {adherence}%
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-border bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground sm:px-6">
        Showing {sortedRows.length} {sortedRows.length === 1 ? "period" : "periods"}
      </div>
    </div>
  );
}

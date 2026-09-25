"use client";

import React from "react";

import { Chip } from "@/components/ui/chip";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { formatCount, formatPercent } from "@/lib/format";
import { periodLabel } from "@/shared/calc/report";
import type { ReportGranularity } from "@/shared/enums";
import type { ReportRow } from "@/shared/types";

/**
 * §11.11 missed-dose analysis — the worst rows in the report (missed > 0), leading
 * with the missiest period. Downstream of the same ReportRow table so numbers match.
 */
export function MissedAnalysis({ granularity, rows }: { granularity: ReportGranularity; rows: ReportRow[] }) {
  const missed = rows
    .filter((row) => row.missed > 0)
    .sort((a, b) => b.missed - a.missed || a.adherencePercent! - b.adherencePercent!);

  if (missed.length === 0) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 shadow-card-sm">
        <span className="text-sm text-muted-foreground">No missed doses in this report.</span>
        <Chip tone="emerald">Perfect</Chip>
      </div>
    );
  }

  const columns: readonly DataTableColumn<ReportRow>[] = [
    {
      key: "period",
      header: granularity === "daily" ? "Day" : granularity === "weekly" ? "Week" : "Month",
      value: (row) => periodLabel(row.period, granularity),
      render: (row) => <span className="font-medium text-ink-900">{periodLabel(row.period, granularity)}</span>,
    },
    { key: "missed", header: "Missed", value: (row) => row.missed, align: "right" },
    {
      key: "adherence",
      header: "Adherence",
      value: (row) => row.adherencePercent ?? -1,
      align: "right",
      render: (row) =>
        row.adherencePercent == null ? (
          <span className="text-muted-foreground">No data</span>
        ) : (
          <Chip tone={row.adherencePercent >= 80 ? "emerald" : row.adherencePercent >= 60 ? "amber" : "magenta"}>
            {formatPercent(row.adherencePercent)}
          </Chip>
        ),
    },
    {
      key: "count",
      header: "Scheduled",
      value: (row) => row.scheduled,
      align: "right",
      render: (row) => <span className="text-muted-foreground">{formatCount(row.scheduled)}</span>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={missed}
      rowKey={(row) => row.period}
      ariaLabel="Missed dose analysis"
      pageSize={0}
      footer={missed.length > 0 ? `${missed.length} period${missed.length > 1 ? "s" : ""} with missed doses` : undefined}
    />
  );
}